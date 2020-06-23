## OpenSeadragonImagingHelper

[![Gitter](https://badges.gitter.im/Join_Chat.svg)](https://gitter.im/msalsbery/OpenSeadragonImaging?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

OpenSeadragonImagingHelper is a plugin for [OpenSeadragon](https://github.com/openseadragon/openseadragon)
which implements some properties and methods helpful in
imaging applications.

[View the Documentation](http://msalsbery.github.io/openseadragon-imaging/docs/openseadragon-imaginghelper/index.html)

[See the OpenSeadragon Imaging Demo/Test Site Live](http://msalsbery.github.io/openseadragon-imaging/demo/index.html)

### Usage

_**Prerequisite note: OpenSeadragonImagingHelper requires [OpenSeadragon](https://github.com/openseadragon/openseadragon) version 2.0+.**_

The OpenSeadragonImagingHelper bundle can be obtained the following ways:

1. Direct download [openseadragon-imaginghelper.js](http://msalsbery.github.io/openseadragon-imaging/builds/openseadragon-imaginghelper.js) (and optionally [openseadragon-imaginghelper.js.map](http://msalsbery.github.io/openseadragon-imaging/builds/openseadragon-imaginghelper.js.map))
2. npm

```
    npm install @openseadragon-imaging/openseadragon-imaginghelper
```

The OpenSeadragonImagingHelper bundle can be included using a script tag in HTML or imported as a library module (ES2015, CommonJS, AMD).

An **ImagingHelper** object can be created and attached to an [OpenSeadragon.Viewer](http://openseadragon.github.io/docs/OpenSeadragon.Viewer.html) two ways:

1. Call the activateImagingHelper method on the viewer
2. Create a new ImagingHelper object, passing a viewer reference in the options parameter

Both methods return a new ImagingHelper object, and both methods also add the ImagingHelper
object reference to the viewer as a property called 'imagingHelper'.

**Example using an HTML script tag**

```html
<script
  type="text/javascript"
  src="path_to/openseadragon/openseadragon.js"
></script>
<script
  type="text/javascript"
  src="path_to/openseadragon-imaging/openseadragon-imaginghelper.js"
></script>
```

```javascript
    // Example 1 - Use the Viewer.activateImagingHelper() method to create an ImagingHelper

    // create an OpenSeadragon viewer
    var viewer = window.OpenSeadragon({...});
    // add an ImagingHelper to the viewer
    var imagingHelper = viewer.activateImagingHelper({...});


    // Example 2 - Attach a new ImagingHelper to an existing OpenSeadragon.Viewer

    var imagingHelper = new window.OpenSeadragonImaging.ImagingHelper({viewer: existingviewer});
```

**Example importing as a module**

```
    npm install openseadragon --save
    npm install @openseadragon-imaging/openseadragon-imaginghelper --save
```

```javascript
import OpenSeadragon from 'openseadragon';
import OpenSeadragonImagingHelper from '@openseadragon-imaging/openseadragon-imaginghelper';

    // Example 1 - Use the Viewer.activateImagingHelper() method to create an ImagingHelper

    // create an OpenSeadragon viewer
    var viewer = OpenSeadragon({...});
    // add an ImagingHelper to the viewer
    var imagingHelper = viewer.activateImagingHelper({...});


    // Example 2 - Attach a new ImagingHelper to an existing OpenSeadragon.Viewer

    var imagingHelper = new OpenSeadragonImagingHelper({viewer: existingviewer});
```

### Details

The ImagingHelper class provides a simplified zoomFactor which is simply the ratio
of the displayed image pixel size to the image's native pixel size.

In OpenSeadragon 2.0 and above, conversion is based on the image at index 0 in world.getItemAt, unless another value is set by the worldIndex option.

The ImagingHelper methods use three coordinate systems,
named as follows:

1. **physical:** Device pixel coordinates relative to the SeaDragon viewer
2. **logical:** 0.0 to 1.0 relative to the image's native dimensions
3. **data:** Pixel coordinates relative to the image's native dimensions

Methods are provided to zoom and/or pan using these conventions, as well as to convert
individual horizontal/vertical values or point ({x,y}) objects between coordinate systems
**(Note: methods that return a point object return new [OpenSeadragon.Point](http://openseadragon.github.io/docs/OpenSeadragon.Point.html)
objects)**

The ImagingHelper class extends the [OpenSeadragon.EventSource](http://openseadragon.github.io/docs/OpenSeadragon.EventHandler.html) class and raises
an event named **'image-view-changed'** whenever the viewer's zoom and/or pan position changes.

```javascript
    // Event Example 1 - Use the options 'onImageViewChanged' property to set a handler

    var viewer = OpenSeadragon({...});
    var imagingHelper = viewer.activateImagingHelper({onImageViewChanged: onImageViewChanged});

    function onImageViewChanged(event) {
        // event.viewportWidth == width of viewer viewport in logical coordinates relative to image native size
        // event.viewportHeight == height of viewer viewport in logical coordinates relative to image native size
        // event.viewportOrigin == OpenSeadragon.Point, top-left of the viewer viewport in logical coordinates relative to image
        // event.viewportCenter == OpenSeadragon.Point, center of the viewer viewport in logical coordinates relative to image
        // event.zoomFactor == current zoom factor
        ...
    }


    // Event Example 2 - Add a handler to an existing ImagingHelper

    imagingHelper.addHandler('image-view-changed', function (event) {
        // event.viewportWidth == width of viewer viewport in logical coordinates relative to image native size
        // event.viewportHeight == height of viewer viewport in logical coordinates relative to image native size
        // event.viewportOrigin == OpenSeadragon.Point, top-left of the viewer viewport in logical coordinates relative to image
        // event.viewportCenter == OpenSeadragon.Point, center of the viewer viewport in logical coordinates relative to image
        // event.zoomFactor == current zoom factor
        ...
    });
```

### Demo/Test Site

The 'demo' folder provides a demo/test site.
The page displays many OpenSeadragon and OpenSeadragonImagingHelper metrics, as well as the output of many OpenSeadragonImagingHelper methods,
all in real-time as the cursor moves and/or the image is zoomed/panned. Four sample images are provided.

Additionally, there's an example of syncing an SVG overlay for annotation support.

All the sample code is in [demo/scripts/viewmodel.js](http://msalsbery.github.io/openseadragon-imaging/demo/scripts/viewmodel.js).

### Notes

### In the works...

1. Better multi-image support
