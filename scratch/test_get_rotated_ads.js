const { getRotatedAds } = require('../lib/ad-service');

async function test() {
    try {
        console.log("=== Testing getRotatedAds('PREMIUM') ===");
        const p = await getRotatedAds('PREMIUM', 50, '');
        console.log("PREMIUM count:", p.length);
        if (p.length > 0) {
            console.log("PREMIUM first ad:", p[0]);
        }

        console.log("\n=== Testing getRotatedAds('SPECIAL') ===");
        const s = await getRotatedAds('SPECIAL', 50, '');
        console.log("SPECIAL count:", s.length);

        console.log("\n=== Testing getRotatedAds('GENERAL') ===");
        const g = await getRotatedAds('GENERAL', 50, '');
        console.log("GENERAL count:", g.length);
    } catch (e) {
        console.error("Error in test:", e);
    }
}

test();
