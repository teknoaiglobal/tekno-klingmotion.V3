async function runTests() {
    const url = 'http://localhost:3000/api/public/tokens';

    console.log('--- TEST 1: Menambahkan 100 Token Valid ---');
    const validTokens = [];
    for(let i=0; i<100; i++) {
        // Generate random 32 hex
        let hex = '';
        while(hex.length < 32) {
            hex += Math.random().toString(16).substring(2);
        }
        validTokens.push('FPSX' + hex.substring(0, 32));
    }
    
    let res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens: validTokens })
    });
    console.log('Response:', await res.json());


    console.log('\n--- TEST 2: Duplikasi Token (Mengirim 5 token yang sama dari Test 1) ---');
    const dupTokens = validTokens.slice(0, 5);
    res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens: dupTokens })
    });
    console.log('Response:', await res.json());


    console.log('\n--- TEST 3: Format Invalid ---');
    const invalidTokens = [
        'FPSX123', // terlalu pendek
        'XYZ12345678901234567890123456789012', // tidak diawali FPSX
        'FPSX' + 'Z'.repeat(32), // karakter non-hex
        '' // kosong
    ];
    res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens: invalidTokens })
    });
    console.log('Response:', await res.json());

    console.log('\n--- TEST 4: Campuran Valid, Invalid, dan Duplikat ---');
    const mixedTokens = [
        validTokens[10], // duplikat
        'FPSX11112222333344445555666677778888', // valid baru
        'FPSXinvalid'
    ];
    res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens: mixedTokens })
    });
    console.log('Response:', await res.json());
}

runTests().catch(console.error);