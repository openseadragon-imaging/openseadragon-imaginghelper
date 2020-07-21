import OpenSeadragon from 'openseadragon';

/**
 * @file openseadragon-imaginghelper.js
 * @version <%= pkg.version %>
 * @author Mark Salsbery <msalsbery@hotmail.com>
 *
 */

/**
 * @module openseadragon-imaginghelper
 * @version <%= pkg.version %>
 * @requires module:openseadragon
 */

export default (function (OSD, $) {
	if (!OSD.version || OSD.version.major < 2) {
		throw new Error(
			'OpenSeadragonImagingHelper requires OpenSeadragon version 2.0.0+'
		);
	}

	/**
	 * Creates a new ImagingHelper attached to the viewer.
	 *
	 * @method activateImagingHelper
	 * @memberof external:"OpenSeadragon.Viewer"#
	 * @param {Object} options
	 * @param {external:"OpenSeadragon.EventHandler"} [options.onImageViewChanged] - {@link OpenSeadragonImaging.ImagingHelper.event:image-view-changed} handler method.
	 * @param {Integer} [options.worldIndex] - The index of the image for world.getItemAt
	 * @returns {OpenSeadragonImaging.ImagingHelper}
	 *
	 **/
	OSD.Viewer.prototype.activateImagingHelper = function (options) {
		if (!this.imagingHelper) {
			options = options || {};
			options.viewer = this;
			this.imagingHelper = new $.ImagingHelper(options);
		}
		return this.imagingHelper;
	};

	/**
	 * Creates a new ImagingHelper attached to the viewer instance passed in the options parameter.
	 *
	 * @class ImagingHelper
	 * @classdesc Provides imaging helper methods and properties for the OpenSeadragon viewer.
	 * @memberof OpenSeadragonImaging
	 * @extends external:"OpenSeadragon.EventSource"
	 * @param {Object} options
	 * @param {external:"OpenSeadragon.Viewer"} options.viewer - Required! Reference to OpenSeadragon viewer to attach to.
	 * @param {external:"OpenSeadragon.EventHandler"} [options.onImageViewChanged] - {@link OpenSeadragonImaging.ImagingHelper.event:image-view-changed} handler method.
	 * @param {Integer} [options.worldIndex] - The index of the image for world.getItemAt
	 *
	 **/
	$.ImagingHelper = function (options) {
		OSD.EventSource.call(this);

		options = options || {};

		if (!options.viewer) {
			throw new Error('A viewer must be specified.');
		}
		if (options.viewer.imagingHelper) {
			throw new Error('Viewer already has an ImagingHelper.');
		}

		this._viewer = options.viewer;

		if (typeof options.worldIndex === 'number') {
			this._worldIndex = options.worldIndex;
		} else {
			this._worldIndex = 0;
		}

		// Add this object to the Viewer
		this._viewer.imagingHelper = this;

		/**
		 * A reference to the options passed at creation.
		 * @member {object} options
		 * @memberof OpenSeadragonImaging.ImagingHelper#
		 * @property {external:"OpenSeadragon.Viewer"} viewer - Reference to OpenSeadragon viewer this ImagingHelper is attached to.
		 * @property {external:"OpenSeadragon.EventHandler"} [onImageViewChanged] - {@link OpenSeadragonImaging.ImagingHelper.event:image-view-changed} handler method.
		 */
		this.options = options;
		/**
		 * The image's native width in pixels.
		 * @member {number} imgWidth
		 * @memberof OpenSeadragonImaging.ImagingHelper#
		 */
		this.imgWidth = 0.0;
		/**
		 * The image's native height in pixels.
		 * @member {number} imgHeight
		 * @memberof OpenSeadragonImaging.ImagingHelper#
		 */
		this.imgHeight = 0.0;
		/**
		 * The image's aspect ratio (width / height).
		 * @member {number} imgAspectRatio
		 * @memberof OpenSeadragonImaging.ImagingHelper#
		 */
		this.imgAspectRatio = 0.0;

		// Private
		this._zoomFactor = 1.0;
		this._minZoom = 0.001;
		this._maxZoom = 10;
		this._zoomStepPercent = 30;
		this._haveImage = false;
		this._viewerSize = null;
		// Unadjusted viewport settings (aspect ratio not applied)
		// All coordinates are logical (0 to 1) relative to the image
		this._viewportWidth = 0.0;
		this._viewportHeight = 0.0;
		this._viewportOrigin = new OSD.Point(0, 0);
		this._viewportCenter = new OSD.Point(0, 0);

		// Wire up event handlers
		this._onOpen = OSD.delegate(this, this.onOpen);
		this._onClose = OSD.delegate(this, this.onClose);
		this._onAnimation = OSD.delegate(this, this.onAnimation);
		this._onAnimationFinish = OSD.delegate(this, this.onAnimationFinish);
		this._onResize = OSD.delegate(this, this.onResize);
		this._onFullPage = OSD.delegate(this, this.onFullPage);
		this._onFullScreen = OSD.delegate(this, this.onFullScreen);
		this._onWorldAddItem = OSD.delegate(this, this.onWorldAddItem);
		this._onWorldRemoveItem = OSD.delegate(this, this.onWorldRemoveItem);
		this._onWorldItemIndexChange = OSD.delegate(
			this,
			this.onWorldItemIndexChange
		);
		this._onWorldMetricsChange = OSD.delegate(
			this,
			this.onWorldMetricsChange
		);
		if (options.onImageViewChanged) {
			this.addHandler('image-view-changed', options.onImageViewChanged);
		}
		this._viewer.addHandler('open', this._onOpen);
		this._viewer.addHandler('close', this._onClose);
		this._viewer.addHandler('animation', this._onAnimation);
		this._viewer.addHandler('animation-finish', this._onAnimationFinish);
		this._viewer.addHandler('resize', this._onResize);
		this._viewer.addHandler('full-page', this._onFullPage);
		this._viewer.addHandler('full-screen', this._onFullScreen);
		// this._viewer.world.addHandler('add-item', this._onWorldAddItem);
		// this._viewer.world.addHandler('remove-item', this._onWorldRemoveItem);
		// this._viewer.world.addHandler(
		// 	'item-index-change',
		// 	this._onWorldItemIndexChange
		// );
		// this._viewer.world.addHandler(
		// 	'metrics-change',
		// 	this._onWorldMetricsChange
		// );
	};

	// Inherit OpenSeadragon.EventSource
	$.ImagingHelper.prototype = Object.create(OSD.EventSource.prototype);

	/**
	 * ImagingHelper version.
	 * @member {Object} OpenSeadragonImaging.ImagingHelper.version
	 * @static
	 * @property {String} versionStr - The version number as a string ('major.minor.revision').
	 * @property {Number} major - The major version number.
	 * @property {Number} minor - The minor version number.
	 * @property {Number} revision - The revision number.
	 */
	$.ImagingHelper.version = '<%= pkg.version.obj %>';

	Object.defineProperty($.ImagingHelper.prototype, 'constructor', {
		enumerable: false,
		value: $.ImagingHelper
	});

	/**
	 * Remove hooks, event handlers, and OpenSeadragon references. Call before
	 * OpenSeadragon.Viewer.destroy().
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#destroy
	 * @since 2.2.0
	 */
	$.ImagingHelper.prototype.destroy = function () {
		if (this.options.onImageViewChanged) {
			this.removeHandler(
				'image-view-changed',
				this.options.onImageViewChanged
			);
		}
		this._viewer.removeHandler('open', this._onOpen);
		this._viewer.removeHandler('close', this._onClose);
		this._viewer.removeHandler('animation', this._onAnimation);
		this._viewer.removeHandler('animation-finish', this._onAnimationFinish);
		this._viewer.removeHandler('resize', this._onResize);
		this._viewer.removeHandler('full-page', this._onFullPage);
		this._viewer.removeHandler('full-screen', this._onFullScreen);
		// this._viewer.world.removeHandler('add-item', this._onWorldAddItem);
		// this._viewer.world.removeHandler(
		// 	'remove-item',
		// 	this._onWorldRemoveItem
		// );
		// this._viewer.world.removeHandler(
		// 	'item-index-change',
		// 	this._onWorldItemIndexChange
		// );
		// this._viewer.world.removeHandler(
		// 	'metrics-change',
		// 	this._onWorldMetricsChange
		// );
		this._viewer.imagingHelper = null;
		this._viewer.destroy();
		this._viewer = null;
		this.options.viewer = null;
	};

	/*
	 *
	 * Raises the {@link OpenSeadragonImaging.ImagingHelper.image-view-changed} event
	 *
	 * @private
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#_raiseImageViewChanged
	 *
	 **/
	$.ImagingHelper.prototype._raiseImageViewChanged = function () {
		/**
		 * Raised whenever the viewer's zoom or pan changes and the ImagingHelper's properties have been updated.
		 * @event image-view-changed
		 * @memberof OpenSeadragonImaging.ImagingHelper
		 * @type {Object}
		 * @property {OpenSeadragonImaging.ImagingHelper} eventSource - A reference to the ImagingHelper which raised the event.
		 * @property {number} viewportWidth - Width of viewport in logical coordinates.
		 * @property {number} viewportHeight - Height of viewport in logical coordinates.
		 * @property {external:"OpenSeadragon.Point"} viewportOrigin - Center of viewport in logical coordinates.
		 * @property {external:"OpenSeadragon.Point"} viewportCenter - Center of viewport in logical coordinates.
		 * @property {number} zoomFactor - Zoom factor.
		 * @property {Object} [userData=null] - Arbitrary subscriber-defined object.
		 */
		this.raiseEvent('image-view-changed', {
			viewportWidth: this._viewportWidth,
			viewportHeight: this._viewportHeight,
			viewportOrigin: this._viewportOrigin,
			viewportCenter: this._viewportCenter,
			zoomFactor: this._zoomFactor
		});
	};

	/*
	 *
	 * Called whenever the OpenSeadragon viewer zoom/pan changes
	 *
	 * @private
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#_trackZoomPan
	 * @fires OpenSeadragonImaging.ImagingHelper.image-view-changed
	 *
	 **/
	$.ImagingHelper.prototype._trackZoomPan = function () {
		var boundsRect = this._viewer.viewport.getBounds(true);
		this._viewportOrigin.x = boundsRect.x;
		this._viewportOrigin.y = boundsRect.y * this.imgAspectRatio;
		this._viewportWidth = boundsRect.width;
		this._viewportHeight = boundsRect.height * this.imgAspectRatio;
		this._viewportCenter.x =
			this._viewportOrigin.x + this._viewportWidth / 2.0;
		this._viewportCenter.y =
			this._viewportOrigin.y + this._viewportHeight / 2.0;
		this._zoomFactor =
			this.getViewerContainerSize().x /
			(this._viewportWidth * this.imgWidth);

		this._raiseImageViewChanged();
	};

	/**
	 * Gets the size of the viewer's container element.
	 *
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#getViewerContainerSize
	 * @returns {external:"OpenSeadragon.Point"}
	 *
	 **/
	$.ImagingHelper.prototype.getViewerContainerSize = function () {
		//return this._viewer.viewport.getContainerSize();
		var element = this._viewer.container;
		//return new OSD.Point(
		//    (element.clientWidth === 0 ? 1 : element.clientWidth),
		//    (element.clientHeight === 0 ? 1 : element.clientHeight)
		//);
		return new OSD.Point(element.clientWidth, element.clientHeight);
	};

	/**
	 * Helper method for users of the OpenSeadragon.Viewer's autoResize = false option.
	 * Call this whenever the viewer is resized, and the image will stay displayed at
	 * the same zoom factor and same center point.
	 *
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#notifyResize
	 * @fires OpenSeadragonImaging.ImagingHelper.image-view-changed
	 *
	 **/
	$.ImagingHelper.prototype.notifyResize = function () {
		var newViewerSize, center, zoom;
		if (this._haveImage) {
			newViewerSize = this.getViewerContainerSize();
			if (!newViewerSize.equals(this._viewerSize)) {
				this._viewerSize = newViewerSize;
				center = new OSD.Point(
					this._viewportCenter.x,
					this._viewportCenter.y / this.imgAspectRatio
				);
				zoom = this._zoomFactor;
				this._viewer.viewport.resize(newViewerSize, false);
				this._viewer.viewport.zoomTo(
					(zoom * this.imgWidth) / newViewerSize.x,
					null,
					true
				);
				this._viewer.viewport.panTo(center, true);
				this._raiseImageViewChanged();
			}
		}
	};

	/**
	 * Gets the minimum zoom factor allowed.
	 *
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#getMinZoom
	 * @returns {number}
	 *
	 **/
	$.ImagingHelper.prototype.getMinZoom = function () {
		return this._minZoom;
	};

	/**
	 * Sets the minimum zoom factor allowed.
	 *
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#setMinZoom
	 * @param {number} value - The desired minimum zoom factor.
	 *
	 **/
	$.ImagingHelper.prototype.setMinZoom = function (value) {
		this._minZoom = value;
		this._viewer.minZoomLevel =
			(value * this.imgWidth) / this.getViewerContainerSize().x;
	};

	/**
	 * Gets the maximum zoom factor allowed.
	 *
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#getMaxZoom
	 * @returns {number}
	 *
	 **/
	$.ImagingHelper.prototype.getMaxZoom = function () {
		return this._maxZoom;
	};

	/**
	 * Sets the maximum zoom factor allowed.
	 *
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#setMaxZoom
	 * @param {number} value - The desired maximum zoom factor.
	 *
	 **/
	$.ImagingHelper.prototype.setMaxZoom = function (value) {
		this._maxZoom = value;
		this._viewer.maxZoomLevel =
			(value * this.imgWidth) / this.getViewerContainerSize().x;
	};

	/**
	 * Gets the percentage of the current zoom factor to increase/decrease when using the zoomIn/zoomOut methods.
	 *
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#getZoomStepPercent
	 * @returns {number}
	 *
	 **/
	$.ImagingHelper.prototype.getZoomStepPercent = function () {
		return this._zoomStepPercent;
	};

	/**
	 * Sets the percentage of the current zoom factor to increase/decrease when using the zoomIn/zoomOut methods.
	 *
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#setZoomStepPercent
	 * @param {number} value - The desired percentage.
	 *
	 **/
	$.ImagingHelper.prototype.setZoomStepPercent = function (value) {
		this._zoomStepPercent = value;
	};

	/**
	 * Zooms and/or pans the viewport based on a viewport width and center point.
	 *
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#setView
	 * @param {number} width - The desired viewport width in logical units.
	 * @param {number} height - The desired viewport width in logical units (currently not used, native image aspect ratio is preserved).
	 * @param {external:"OpenSeadragon.Point"} centerpoint - The desired viewport center point in logical units.
	 * @param {boolean} [immediately] - If true, the view is set immediately with no spring animation.
	 *
	 **/
	$.ImagingHelper.prototype.setView = function (
		width,
		height,
		centerpoint,
		immediately
	) {
		if (this._haveImage) {
			if (
				this._viewportWidth !== width ||
				this._viewportHeight !== height
			) {
				this._viewer.viewport.zoomTo(1.0 / width, null, immediately);
			}
			if (
				this._viewportCenter.x !== centerpoint.x ||
				this._viewportCenter.y !== centerpoint.y
			) {
				this._viewer.viewport.panTo(
					new OSD.Point(
						centerpoint.x,
						centerpoint.y / this.imgAspectRatio
					),
					immediately
				);
			}
		}
	};

	/**
	 * Gets the current zoom factor, the ratio of the displayed size to the image's native size.
	 *
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#getZoomFactor
	 * @returns {number}
	 *
	 **/
	$.ImagingHelper.prototype.getZoomFactor = function () {
		return this._zoomFactor;
	};

	/**
	 * Sets the zoom factor, the ratio of the displayed size to the image's native size.
	 *
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#setZoomFactor
	 * @param {number} value - The desired zoom factor.
	 * @param {boolean} [immediately] - If true, the view is set immediately with no spring animation.
	 *
	 **/
	$.ImagingHelper.prototype.setZoomFactor = function (value, immediately) {
		if (this._haveImage && value !== this._zoomFactor && value > 0.0) {
			this._viewer.viewport.zoomTo(
				(value * this.imgWidth) / this.getViewerContainerSize().x,
				new OSD.Point(
					this._viewportCenter.x,
					this._viewportCenter.y / this.imgAspectRatio
				),
				immediately
			);
		}
	};

	/**
	 * Zooms in by a factor of getZoomStepPercent().
	 *
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#zoomIn
	 * @param {boolean} [immediately] - If true, the view is set immediately with no spring animation.
	 *
	 **/
	$.ImagingHelper.prototype.zoomIn = function (immediately) {
		var newzoom = this._zoomFactor;
		newzoom *= 1.0 + this._zoomStepPercent / 100.0;
		if (newzoom > this._maxZoom) {
			newzoom = this._maxZoom;
		}
		this.setZoomFactor(newzoom, immediately);
	};

	/**
	 * Zooms out by a factor of getZoomStepPercent().
	 *
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#zoomOut
	 * @param {boolean} [immediately] - If true, the view is set immediately with no spring animation.
	 *
	 **/
	$.ImagingHelper.prototype.zoomOut = function (immediately) {
		var newzoom = this._zoomFactor;
		newzoom /= 1.0 + this._zoomStepPercent / 100.0;
		if (newzoom < this._minZoom) {
			newzoom = this._minZoom;
		}
		this.setZoomFactor(newzoom, immediately);
	};

	/**
	 * Sets the zoom factor, the ratio of the displayed size to the image's native size, leaving the logical point in the same viewer position.
	 *
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#zoomAboutLogicalPoint
	 * @param {number} newzoomfactor - The desired zoom factor.
	 * @param {external:"OpenSeadragon.Point"} logpoint - The logical point to remain in current displayed position.
	 * @param {boolean} [immediately] - If true, the view is set immediately with no spring animation.
	 *
	 **/
	$.ImagingHelper.prototype.zoomAboutLogicalPoint = function (
		newzoomfactor,
		logpoint,
		immediately
	) {
		if (
			this._haveImage &&
			newzoomfactor !== this._zoomFactor &&
			newzoomfactor > 0.0
		) {
			this._viewer.viewport.zoomTo(
				(newzoomfactor * this.imgWidth) /
					this.getViewerContainerSize().x,
				new OSD.Point(logpoint.x, logpoint.y / this.imgAspectRatio),
				immediately
			);
		}
	};

	/**
	 * Zooms in by a factor of getZoomStepPercent(), leaving the logical point in the same viewer position.
	 *
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#zoomInAboutLogicalPoint
	 * @param {external:"OpenSeadragon.Point"} logpoint - The logical point to remain in current displayed position.
	 * @param {boolean} [immediately] - If true, the view is set immediately with no spring animation.
	 *
	 **/
	$.ImagingHelper.prototype.zoomInAboutLogicalPoint = function (
		logpoint,
		immediately
	) {
		var newzoom = this._zoomFactor;
		newzoom *= 1.0 + this._zoomStepPercent / 100.0;
		if (newzoom > this._maxZoom) {
			newzoom = this._maxZoom;
		}
		this.zoomAboutLogicalPoint(newzoom, logpoint, immediately);
	};

	/**
	 * Zooms out by a factor of getZoomStepPercent(), leaving the logical point in the same viewer position.
	 *
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#zoomOutAboutLogicalPoint
	 * @param {external:"OpenSeadragon.Point"} logpoint - The logical point to remain in current displayed position.
	 * @param {boolean} [immediately] - If true, the view is set immediately with no spring animation.
	 *
	 **/
	$.ImagingHelper.prototype.zoomOutAboutLogicalPoint = function (
		logpoint,
		immediately
	) {
		var newzoom = this._zoomFactor;
		newzoom /= 1.0 + this._zoomStepPercent / 100.0;
		if (newzoom < this._minZoom) {
			newzoom = this._minZoom;
		}
		this.zoomAboutLogicalPoint(newzoom, logpoint, immediately);
	};

	/**
	 * Pans the view so the logical point is centered in the viewport.
	 *
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#centerAboutLogicalPoint
	 * @param {external:"OpenSeadragon.Point"} logpoint - The desired center point.
	 * @param {boolean} [immediately] - If true, the view is set immediately with no spring animation.
	 *
	 **/
	$.ImagingHelper.prototype.centerAboutLogicalPoint = function (
		logpoint,
		immediately
	) {
		if (
			this._haveImage &&
			(this._viewportCenter.x !== logpoint.x ||
				this._viewportCenter.y !== logpoint.y)
		) {
			this._viewer.viewport.panTo(
				new OSD.Point(logpoint.x, logpoint.y / this.imgAspectRatio),
				immediately
			);
		}
	};

	/**
	 *
	 *
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#physicalToLogicalPoint
	 *
	 **/
	$.ImagingHelper.prototype.physicalToLogicalPoint = function (point) {
		return new OSD.Point(
			this.physicalToLogicalX(point.x),
			this.physicalToLogicalY(point.y)
		);
	};

	/**
	 *
	 *
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#logicalToPhysicalPoint
	 *
	 **/
	$.ImagingHelper.prototype.logicalToPhysicalPoint = function (point) {
		return new OSD.Point(
			this.logicalToPhysicalX(point.x),
			this.logicalToPhysicalY(point.y)
		);
	};

	/**
	 *
	 *
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#physicalToLogicalX
	 *
	 **/
	$.ImagingHelper.prototype.physicalToLogicalX = function (x) {
		return this._haveImage
			? this._viewportOrigin.x +
					(x / this.getViewerContainerSize().x) * this._viewportWidth
			: 0;
	};

	/**
	 *
	 *
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#physicalToLogicalY
	 *
	 **/
	$.ImagingHelper.prototype.physicalToLogicalY = function (y) {
		return this._haveImage
			? this._viewportOrigin.y +
					(y / this.getViewerContainerSize().y) * this._viewportHeight
			: 0;
	};

	/**
	 *
	 *
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#logicalToPhysicalX
	 *
	 **/
	$.ImagingHelper.prototype.logicalToPhysicalX = function (x) {
		return this._haveImage
			? ((x - this._viewportOrigin.x) / this._viewportWidth) *
					this.getViewerContainerSize().x
			: 0;
	};

	/**
	 *
	 *
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#logicalToPhysicalY
	 *
	 **/
	$.ImagingHelper.prototype.logicalToPhysicalY = function (y) {
		return this._haveImage
			? ((y - this._viewportOrigin.y) / this._viewportHeight) *
					this.getViewerContainerSize().y
			: 0;
	};

	/**
	 *
	 *
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#physicalToLogicalDistance
	 *
	 **/
	$.ImagingHelper.prototype.physicalToLogicalDistance = function (distance) {
		return this._haveImage
			? (distance / this.getViewerContainerSize().x) * this._viewportWidth
			: 0;
	};

	/**
	 *
	 *
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#logicalToPhysicalDistance
	 *
	 **/
	$.ImagingHelper.prototype.logicalToPhysicalDistance = function (distance) {
		return this._haveImage
			? (distance / this._viewportWidth) * this.getViewerContainerSize().x
			: 0;
	};

	/**
	 *
	 *
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#logicalToDataPoint
	 *
	 **/
	$.ImagingHelper.prototype.logicalToDataPoint = function (point) {
		return new OSD.Point(
			this.logicalToDataX(point.x),
			this.logicalToDataY(point.y)
		);
	};

	/**
	 *
	 *
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#dataToLogicalPoint
	 *
	 **/
	$.ImagingHelper.prototype.dataToLogicalPoint = function (point) {
		return new OSD.Point(
			this.dataToLogicalX(point.x),
			this.dataToLogicalY(point.y)
		);
	};

	/**
	 *
	 *
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#physicalToDataPoint
	 *
	 **/
	$.ImagingHelper.prototype.physicalToDataPoint = function (point) {
		if (this._viewer.world.getItemCount() === 1) {
			return new OSD.Point(
				this.physicalToDataX(point.x),
				this.physicalToDataY(point.y)
			);
		} else {
			var tiledImage = this._viewer.world.getItemAt(this._worldIndex);
			return tiledImage.viewerElementToImageCoordinates(point);
		}
	};

	/**
	 *
	 *
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#dataToPhysicalPoint
	 *
	 **/
	$.ImagingHelper.prototype.dataToPhysicalPoint = function (point) {
		return new OSD.Point(
			this.dataToPhysicalX(point.x),
			this.dataToPhysicalY(point.y)
		);
	};

	/**
	 *
	 *
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#logicalToDataX
	 *
	 **/
	$.ImagingHelper.prototype.logicalToDataX = function (x) {
		return this._haveImage ? x * this.imgWidth : 0;
	};

	/**
	 *
	 *
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#logicalToDataY
	 *
	 **/
	$.ImagingHelper.prototype.logicalToDataY = function (y) {
		return this._haveImage ? y * this.imgHeight : 0;
	};

	/**
	 *
	 *
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#dataToLogicalX
	 *
	 **/
	$.ImagingHelper.prototype.dataToLogicalX = function (x) {
		return this._haveImage && this.imgWidth > 0 ? x / this.imgWidth : 0;
	};

	/**
	 *
	 *
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#dataToLogicalY
	 *
	 **/
	$.ImagingHelper.prototype.dataToLogicalY = function (y) {
		return this._haveImage && this.imgHeight > 0 ? y / this.imgHeight : 0;
	};

	/**
	 *
	 *
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#physicalToDataX
	 *
	 **/
	$.ImagingHelper.prototype.physicalToDataX = function (x) {
		if (this._viewer.world.getItemCount() === 1) {
			return this._haveImage && this.getViewerContainerSize().x > 0
				? (this._viewportOrigin.x +
						(x / this.getViewerContainerSize().x) *
							this._viewportWidth) *
						this.imgWidth
				: 0;
		} else {
			var tiledImage = this._viewer.world.getItemAt(this._worldIndex);
			var pt = tiledImage.viewerElementToImageCoordinates(
				new OSD.Point(x, 0)
			); //viewportToImageCoordinates x,y,cur or point,cur
			return pt.x;
		}
	};

	/**
	 *
	 *
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#physicalToDataY
	 *
	 **/
	$.ImagingHelper.prototype.physicalToDataY = function (y) {
		if (this._viewer.world.getItemCount() === 1) {
			return this._haveImage && this.getViewerContainerSize().y > 0
				? (this._viewportOrigin.y +
						(y / this.getViewerContainerSize().y) *
							this._viewportHeight) *
						this.imgHeight
				: 0;
		} else {
			var tiledImage = this._viewer.world.getItemAt(this._worldIndex);
			var pt = tiledImage.viewerElementToImageCoordinates(
				new OSD.Point(0, y)
			); //viewportToImageCoordinates x,y,cur or point,cur
			return pt.y;
		}
	};

	/**
	 *
	 *
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#dataToPhysicalX
	 *
	 **/
	$.ImagingHelper.prototype.dataToPhysicalX = function (x) {
		return this._haveImage && this.imgWidth > 0
			? ((x / this.imgWidth - this._viewportOrigin.x) /
					this._viewportWidth) *
					this.getViewerContainerSize().x
			: 0;
	};

	/**
	 *
	 *
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#dataToPhysicalY
	 *
	 **/
	$.ImagingHelper.prototype.dataToPhysicalY = function (y) {
		return this._haveImage && this.imgHeight > 0
			? ((y / this.imgHeight - this._viewportOrigin.y) /
					this._viewportHeight) *
					this.getViewerContainerSize().y
			: 0;
	};

	/*
	 * @private
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#onOpen
	 *
	 **/
	$.ImagingHelper.prototype.onOpen = function (/*event*/) {
		//OSD.console.log('!!! [onOpen]');
		var tiledImage = this._viewer.world.getItemAt(this._worldIndex);

		this._haveImage = true;
		this.imgWidth = tiledImage.source.dimensions.x;
		this.imgHeight = tiledImage.source.dimensions.y;
		this.imgAspectRatio = this.imgWidth / this.imgHeight;

		this._trackZoomPan();
	};

	/*
	 * @private
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#onClose
	 *
	 **/
	$.ImagingHelper.prototype.onClose = function () {
		//OSD.console.log('!!! [onClose]');
		this._haveImage = false;
		this.imgWidth = 0.0;
		this.imgHeight = 0.0;
		this.imgAspectRatio = 0.0;
	};

	/*
	 * @private
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#onAnimation
	 *
	 **/
	$.ImagingHelper.prototype.onAnimation = function () {
		this._trackZoomPan();
	};

	/*
	 * @private
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#onAnimationFinish
	 *
	 **/
	$.ImagingHelper.prototype.onAnimationFinish = function () {
		this._trackZoomPan();
	};

	/*
	 * @private
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#onResize
	 *
	 **/
	$.ImagingHelper.prototype.onResize = function () {
		if (this._viewer.autoResize) {
			this._trackZoomPan();
		}
	};

	/*
	 * @private
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#onFullPage
	 *
	 **/
	$.ImagingHelper.prototype.onFullPage = function () {
		this._trackZoomPan();
	};

	/*
	 * @private
	 * @method OpenSeadragonImaging.ImagingHelper.prototype#onFullScreen
	 *
	 **/
	$.ImagingHelper.prototype.onFullScreen = function () {
		this._trackZoomPan();
	};

	// /*
	//  * @private
	//  * @method OpenSeadragonImaging.ImagingHelper.prototype#onWorldAddItem
	//  *
	//  **/
	// $.ImagingHelper.prototype.onWorldAddItem = function (/*event*/) {
	// 	//OSD.console.log( '!!! onWorldAddItem', request.status, url );
	// 	//OSD.console.log('!!! [onWorldAddItem]');
	// 	// this._trackZoomPan();
	// };

	// /*
	//  * @private
	//  * @method OpenSeadragonImaging.ImagingHelper.prototype#onWorldRemoveItem
	//  *
	//  **/
	// $.ImagingHelper.prototype.onWorldRemoveItem = function (/*event*/) {
	// 	//OSD.console.log('!!! [onWorldRemoveItem]');
	// 	// this._trackZoomPan();
	// };

	// /*
	//  * @private
	//  * @method OpenSeadragonImaging.ImagingHelper.prototype#onWorldItemIndexChange
	//  *
	//  **/
	// $.ImagingHelper.prototype.onWorldItemIndexChange = function (/*event*/) {
	// 	//OSD.console.log('!!! [onWorldItemIndexChange]');
	// 	// this._trackZoomPan();
	// };

	// /*
	//  * @private
	//  * @method OpenSeadragonImaging.ImagingHelper.prototype#onWorldMetricsChange
	//  *
	//  **/
	// $.ImagingHelper.prototype.onWorldMetricsChange = function (/*event*/) {
	// 	//OSD.console.log('!!! [onWorldMetricsChange]');
	// 	// this._trackZoomPan();
	// };

	return $.ImagingHelper;
})(
	OpenSeadragon || window.OpenSeadragon,
	(window.OpenSeadragonImaging = window.OpenSeadragonImaging || {})
);
