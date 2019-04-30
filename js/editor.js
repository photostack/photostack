var globalWatermark = {}

var globalFilesCount = 0

// Increase image count after imports
function increaseImageCount(number) {
    globalFilesCount += number
    document.querySelectorAll('.photostack-image-count').forEach(function (el) {
        el.textContent = globalFilesCount
    })
    var exportButton = document.getElementById('photostack-export-button')
    if ((globalFilesCount > 0) && (exportButton.disabled)) {
        exportButton.disabled = false
    }
}

// Apply settings to a canvas
function applyCanvasSettings(canvas, originalImage) {
    // Resize image
    if (document.getElementById('photostack-image-width').value != '') {
        // Use high-quality image scaling where possible
        canvas.getContext('2d').mozImageSmoothingEnabled = true
        canvas.getContext('2d').imageSmoothingQuality = "high"
        canvas.getContext('2d').webkitImageSmoothingEnabled = true
        canvas.getContext('2d').msImageSmoothingEnabled = true
        canvas.getContext('2d').imageSmoothingEnabled = true
        // Get width
        var userWidth = parseInt(document.getElementById('photostack-image-width').value)
        // Create aspect ratio from original canvas size
        var ratio = (canvas.width / canvas.height)
        // Set new canvas size
        var canvasContent = canvas.getImageData
        canvas.width = userWidth
        canvas.height = userWidth / ratio
        // Resizing the canvas wipes its contents, so we need to re-draw the image
        canvas.getContext('2d').drawImage(originalImage, 0, 0, canvas.width, canvas.height)
    }
    // Apply watermark
    if (!(Object.keys(globalWatermark).length === 0)) {
        var watermark = new Image()
        watermark.src = globalWatermark.image
        // Calculate new size of watermark
        var resizeRatio = watermark.height / watermark.width
        var userSize = parseInt(globalWatermark.size)
        watermark.width = canvas.width * (userSize / 100)
        watermark.height = watermark.width * resizeRatio
        // Create temporary canvas for the watermark
        var watermarkCanvas = document.createElement('canvas')
        watermarkCanvas.width = watermark.width
        watermarkCanvas.height = watermark.height
        // Set opacity
        var opacity = parseInt(globalWatermark.opacity) / 100
        watermarkCanvas.getContext('2d').globalAlpha = opacity
        // Set horiztonal and vertical insets
        var horizontalInset = canvas.width * (globalWatermark.horizontalInset / 100)
        var veritcalInset = canvas.height * (globalWatermark.veritcalInset / 100)
        // Set anchor position
        if (globalWatermark.anchorPosition === 1) {
            // Top-left alignment
            // Because the X and Y values start from the top-left, nothing happens here
        } else if (globalWatermark.anchorPosition === 2) {
            // Top-center alignment (Ignore: Horizontal)
            horizontalInset = (canvas.width / 2) - (watermarkCanvas.width / 2)
        } else if (globalWatermark.anchorPosition === 3) {
            // Top-right alignment
            horizontalInset = canvas.width - watermarkCanvas.width - horizontalInset
        } else if (globalWatermark.anchorPosition === 4) {
            // Middle-left alignment (Ignore: Vertical)
            veritcalInset = (canvas.height / 2) - (watermarkCanvas.height / 2)
        } else if (globalWatermark.anchorPosition === 5) {
            // Middle-center alignment (Ignore: Vertical & Horizontal)
            horizontalInset = (canvas.width / 2) - (watermarkCanvas.width / 2)
            veritcalInset = (canvas.height / 2) - (watermarkCanvas.height / 2)
        } else if (globalWatermark.anchorPosition === 6) {
            // Middle-right alignment (Ignore: Vertical)
            horizontalInset = canvas.width - watermarkCanvas.width - horizontalInset
            veritcalInset = (canvas.height / 2) - (watermarkCanvas.height / 2)
        } else if (globalWatermark.anchorPosition === 7) {
            // Bottom-left alignment
            veritcalInset = canvas.height - watermarkCanvas.height - veritcalInset
        } else if (globalWatermark.anchorPosition === 8) {
            // Bottom-center alignment (Ignore: Horizontal)
            veritcalInset = canvas.height - watermarkCanvas.height - veritcalInset
            horizontalInset = (canvas.width / 2) - (watermarkCanvas.width / 2)
        } else if (globalWatermark.anchorPosition === 9) {
            // Bottom-right alignment
            veritcalInset = canvas.height - watermarkCanvas.height - veritcalInset
            horizontalInset = canvas.width - watermarkCanvas.width - horizontalInset
        }
        // Draw completed image to temporary canvas
        watermarkCanvas.getContext('2d').drawImage(watermark, 0, 0, watermark.width, watermark.height)
        canvas.getContext('2d').drawImage(watermarkCanvas, horizontalInset, veritcalInset)
    }
}

// Render canvas of first image, apply settings, and show a preview
function renderPreviewCanvas() {
    // Silently fail if there are no images imported
    if (!document.querySelectorAll('#photostack-original-container img').length) {
        console.log('Nothing to preview.')
        return
    }
    // Find elements
    var previewContainer = document.getElementById('photostack-editor-preview')
    var originalsContainer = document.getElementById('photostack-original-container')
    var canvasContainer = document.getElementById('photostack-canvas-container')
    // Create canvas element for first imported image
    var canvas = document.createElement('canvas')
    var originalImage = originalsContainer.firstChild
    // Add canvas element to canvas container
    canvasContainer.appendChild(canvas)
    canvas.width = originalImage.naturalWidth
    canvas.height = originalImage.naturalHeight
    canvas.getContext('2d').drawImage(originalImage, 0, 0)
    // Apply settings
    applyCanvasSettings(canvas, originalImage)
    // Create image element
    if (previewContainer.querySelector('img')) {
        previewContainer.querySelector('img').setAttribute('src', canvas.toDataURL())
    } else {
        var previewImage = document.createElement('img')
        previewImage.setAttribute('src', canvas.toDataURL())
        previewContainer.innerHTML = ''
        previewContainer.appendChild(previewImage)
    }
}

// Add image from local file
document.getElementById('photostack-import-file').addEventListener('change', function () {
    // Disable file picker while import is in progress
    document.getElementById('photostack-import-file').disabled = true
    document.querySelector('label[for="photostack-import-file"]').textContent = 'Importing images...'
    // Get files
    var files = document.getElementById('photostack-import-file').files
    console.log('Number of files selected: ' + files.length)
    var filesImported = 0
    // Add each image to originals container
    Array.prototype.forEach.call(files, function (file) {
        var image = document.createElement('img')
        var reader = new FileReader()
        // Set the image source to the reader result, once the reader is done
        reader.onload = function () {
            image.src = reader.result
        }
        reader.onerror = function () {
            alert('Could not import this image: ' + file.name)
        }
        // Once both the reader and image is done, we can safely add it to the originals container and clean up
        image.onload = function () {
            // Save image to originals container
            document.getElementById('photostack-original-container').appendChild(image)
            // Increase image counter
            increaseImageCount(1)
        }
        reader.readAsDataURL(file)
    })
    // Clear file select
    document.getElementById('photostack-import-file').value = ''
    // Re-enable file picker
    document.getElementById('photostack-import-file').disabled = false
    document.querySelector('label[for="photostack-import-file"]').textContent = 'Choose image file'
})

// Add image from URL
document.getElementById('photostack-import-url-button').addEventListener('click', function () {
    // Get image URL
    var url = document.getElementById('photostack-import-url').value
    // Get image
    function addImageToCanvas(url) {
        var image = document.createElement('img')
        image.crossOrigin = 'anonymous'
        image.src = url
        image.onload = function () {
            console.log('Loaded image URL: ' + url)
            // Save image to originals container
            document.getElementById('photostack-original-container').appendChild(image)
            // Increase image counter
            increaseImageCount(1)
        }
        image.onerror = function () {
            if (!url.includes('https://cors-anywhere.herokuapp.com/')) {
                console.log('Error loading image, trying CORS Anywhere...')
                addImageToCanvas('https://cors-anywhere.herokuapp.com/' + url)
            } else {
                alert('Could not import URL.')
            }
        }
    }
    addImageToCanvas(url)
})

// Scale image panel
document.getElementById('photostack-image-width-button').addEventListener('click', function () {
    renderPreviewCanvas()
})
document.getElementById('photostack-reset-image-width-button').addEventListener('click', function () {
    document.getElementById('photostack-image-width').value = ''
    renderPreviewCanvas()
})

// Read watermarks from localStorage
for (var i = 0; i < localStorage.length; i++) {
    if (localStorage.key(i).includes('Watermark')) {
        // Add watermark to select menu
        var option = document.createElement('option')
        option.innerText = localStorage.key(i).replace('Watermark: ', '') // Remove "Watermark: " from the key name
        option.value = i
        document.getElementById('photostack-watermark-select').appendChild(option)
    }
}

// Load watermark from storage
document.getElementById('photostack-watermark-select').addEventListener('change', function () {
    if (this.value != 'no-watermark') {
        var selectedWatermark = localStorage.key(this.value)
        var watermarkObj = JSON.parse(localStorage[selectedWatermark])
        // TODO: Validate input
        globalWatermark = watermarkObj
        // Generate preview
        renderPreviewCanvas()
    } else {
        // Reset watermark
        globalWatermark = {}
        // Generate preview
        renderPreviewCanvas()
    }
})

// Prevent unload
window.onbeforeunload = function () {
    // Warn before navigating away if there are any files imported
    if (globalFilesCount > 0) {
        return 'Are you sure you want to navigate away?'
    }
}

// Show errors in UI
window.onerror = function () {
    $('#photostack-error-toast').toast('show')
}