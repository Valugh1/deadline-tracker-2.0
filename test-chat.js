async function testChat() {
  try {
    const res = await fetch('http://localhost:3007/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Crea una attività giornaliera chiamata "fare la spesa" adesso' }]
      })
    });
    
    console.log('Status:', res.status);
    
    if (!res.ok) {
      console.log('Error body:', await res.text());
      return;
    }
    
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      console.log('CHUNK:', decoder.decode(value));
    }
    console.log('STREAM ENDED');
    process.exit(0);
  } catch (e) {
    console.error(e);
  }
}
testChat();
