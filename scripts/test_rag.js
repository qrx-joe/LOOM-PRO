
const fs = require('fs');
const path = require('path');

const API_Base = 'http://localhost:3000';

async function testRAG() {
    try {
        console.log('[Test] Creating Knowledge Base...');
        const createRes = await fetch(`${API_Base}/api/knowledge/bases`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Test KB', description: 'Integration Test' })
        });

        if (!createRes.ok) throw new Error(`Create KB Failed: ${createRes.status}`);
        const kb = await createRes.json();
        console.log(`[Test] KB Created: ${kb.id}`);

        // Test Search (Empty)
        console.log('[Test] Searching (Empty)...');
        const searchRes = await fetch(`${API_Base}/api/knowledge/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: 'AgentFlow features',
                topK: 3
            })
        });

        if (!searchRes.ok) throw new Error(`Search Failed: ${searchRes.status}`);
        const data = await searchRes.json();
        console.log(`[Test] Search Results: ${data.results ? data.results.length : 0} (Total: ${data.total})`);

        // Cleanup
        // await fetch(`${API_Base}/api/knowledge/bases/${kb.id}`, { method: 'DELETE' });

    } catch (error) {
        console.error('[Test] Error:', error.message);
    }
}

testRAG();
