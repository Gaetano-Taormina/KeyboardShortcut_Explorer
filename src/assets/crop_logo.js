const Jimp = require('jimp');
const process = require('process');

async function cropWhiteBorders(imagePath) {
    try {
        const img = await Jimp.read(imagePath);
        const width = img.bitmap.width;
        const height = img.bitmap.height;

        let left = width;
        let right = 0;
        let top = height;
        let bottom = 0;

        img.scan(0, 0, width, height, function (x, y, idx) {
            const r = this.bitmap.data[idx + 0];
            const g = this.bitmap.data[idx + 1];
            const b = this.bitmap.data[idx + 2];

            // If pixel is not "white", update bounding box
            if (!(r > 240 && g > 240 && b > 240)) {
                if (x < left) left = x;
                if (x > right) right = x;
                if (y < top) top = y;
                if (y > bottom) bottom = y;
            }
        });

        if (left < right && top < bottom) {
            // Crop the image
            const cropWidth = right - left + 1;
            const cropHeight = bottom - top + 1;
            img.crop(left, top, cropWidth, cropHeight);

            // Resize to perfect square with black pad
            const size = Math.max(cropWidth, cropHeight);
            
            // Create a new black image
            const finalImg = new Jimp(size, size, 0x000000FF);
            
            const offsetX = Math.floor((size - cropWidth) / 2);
            const offsetY = Math.floor((size - cropHeight) / 2);

            finalImg.composite(img, offsetX, offsetY);

            await finalImg.writeAsync(imagePath);
            console.log("Cropped successfully to", size, "x", size);
        } else {
            console.log("Could not find non-white pixels");
        }
    } catch (err) {
        console.error("Error processing image:", err);
    }
}

if (process.argv.length > 2) {
    cropWhiteBorders(process.argv[2]);
} else {
    console.error("Please provide an image path");
}
