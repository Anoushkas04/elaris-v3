const Jimp = require('jimp');

async function removeGreen() {
    try {
        const image = await Jimp.read('/Users/anoushkasharma/.gemini/antigravity/brain/a6561be7-b76f-4f73-8005-7cd8030a27df/item_lighthouse_1781197450242.png');
        
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
            const r = this.bitmap.data[idx + 0];
            const g = this.bitmap.data[idx + 1];
            const b = this.bitmap.data[idx + 2];
            
            // Bright lime green
            if (g > 200 && r < 120 && b < 120) {
                this.bitmap.data[idx + 3] = 0; // Transparent
            }
            // Anti-aliasing edges might be slightly mixed, let's soften them
            else if (g > 150 && r < 150 && b < 150 && g > r && g > b) {
                 this.bitmap.data[idx + 3] = Math.max(0, 255 - (g - Math.max(r,b))*2);
            }
        });

        await image.writeAsync('/Users/anoushkasharma/Desktop/Elaris-V3/frontend/assets/item_lighthouse.png');
        console.log('Background removed successfully.');
    } catch (e) {
        console.error(e);
    }
}
removeGreen();
