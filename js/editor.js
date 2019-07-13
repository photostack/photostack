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
    if (document.getElementById('photostack-watermark-img').hasAttribute('src')) {
        var watermark = document.getElementById('photostack-watermark-img')
        // Calculate new size of watermark
        var resizeRatio = watermark.naturalHeight / watermark.naturalWidth
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
    // Resize canvas to a maximum of 800 pixels wide for faster processing
    var resizeRatio = originalImage.naturalHeight / originalImage.naturalWidth
    canvas.width = 800
    canvas.height = canvas.width * resizeRatio
    canvas.getContext('2d').drawImage(originalImage, 0, 0, canvas.width, canvas.height)
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

// Import images from file picker
function importLocalFiles(element) {
    var btn = document.getElementById('photostack-import-file-btn')
    var originalBtnText = document.getElementById('photostack-import-file-btn').innerText
    // Disable button while import is in progress
    btn.disabled = true
    btn.textContent = 'Importing images...'
    // Get files
    var files = element.files
    console.log('Number of files selected: ' + files.length)
    // Add each image to originals container
    Array.prototype.forEach.call(files, function (file, index) {
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
            if (index === 0) {
                renderPreviewCanvas()
            }
        }
        reader.readAsDataURL(file)
    })
    // Clear file select
    document.getElementById('photostack-import-file').value = ''
    // Re-enable button
    btn.disabled = false
    btn.textContent = originalBtnText
}

// Add image from URL
function importWebImage(url) {
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
            // Generate preview
            renderPreviewCanvas()
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
}

// Add image from Dropbox
function importDropboxImage() {
    // Set configuration for file picker
    options = {
        success: function(files) {
            // Send each URL to importWebImage function
            files.forEach(function(file) {
                importWebImage(file.link)
            })
        },
        cancel: function() {
            alert('Could not access file from Dropbox.')
        },
        linkType: "direct",
        multiselect: true,
        extensions: ['images'],
        folderselect: false
    }
    Dropbox.choose(options)
}

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
    var watermarkImg = document.getElementById('photostack-watermark-img')
    if (this.value != 'no-watermark') {
        var selectedWatermark = localStorage.key(this.value)
        var watermarkObj = JSON.parse(localStorage[selectedWatermark])
        // TODO: Validate input
        globalWatermark = watermarkObj
        // Copy current watermark to DOM to avoid JS hangups
        watermarkImg.onload = function() {
            // Generate preview
            renderPreviewCanvas()
        }
        document.getElementById('photostack-watermark-img').setAttribute('src', watermarkObj.image)
    } else {
        // Reset watermark
        globalWatermark = {}
        // Delete current watermark image
        document.getElementById('photostack-watermark-img').removeAttribute('src')
        // Generate preview
        renderPreviewCanvas()
    }
})

// Append event listeners to buttons and other elements
document.getElementById('photostack-import-file-btn').addEventListener('click', function() {
    $('#photostack-import-file').click()
})
document.getElementById('photostack-import-file').addEventListener('change', function () {
    importLocalFiles(this)
})
document.getElementById('photostack-import-url-button').addEventListener('click', function () {
    importWebImage(document.getElementById('photostack-import-url').value.trim())
})
document.getElementById('photostack-import-dropbox-btn').addEventListener('click', function() {
    if (!Dropbox.isBrowserSupported()) {
        alert('Sorry, Dropbox does not support your web browser.')
    } else if (!navigator.onLine) {
        alert('You are not connected to the internet. Connect to the internet and try again.')
    } else {
        importDropboxImage()
    }
})
document.getElementById('photostack-image-width-button').addEventListener('click', function () {
    renderPreviewCanvas()
})
document.getElementById('photostack-reset-image-width-button').addEventListener('click', function () {
    document.getElementById('photostack-image-width').value = ''
    renderPreviewCanvas()
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