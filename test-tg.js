async function run() {
    const token = "8665942271:AAHPnfSabu3lU_zCe825IJ6uKGVXx-z39LM";
    const chatId = "1766804856";
    const message = "Test message from server";
    
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML'
        })
    });
    console.log(await res.json());
}
run();
