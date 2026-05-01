
const API_Base = 'http://localhost:3000';

async function testWorkflowExecution() {
    try {
        console.log('[Test] Creating Workflow...');
        // 1. Create Workflow
        const workflow = {
            name: 'Integration Test Workflow',
            nodes: [
                {
                    id: 'trigger-1',
                    type: 'trigger',
                    position: { x: 100, y: 100 },
                    data: { label: 'Start' }
                },
                {
                    id: 'llm-1',
                    type: 'llm',
                    position: { x: 400, y: 100 },
                    data: {
                        label: 'AI Node',
                        model: 'deepseek-chat',
                        systemPrompt: 'You are a test bot. Reply with "Test Passed".'
                    }
                },
                {
                    id: 'end-1',
                    type: 'end',
                    position: { x: 700, y: 100 },
                    data: { label: 'End' }
                }
            ],
            edges: [
                { id: 'e1', source: 'trigger-1', target: 'llm-1' },
                { id: 'e2', source: 'llm-1', target: 'end-1' }
            ]
        };

        const createRes = await fetch(`${API_Base}/api/workflows`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(workflow)
        });

        if (!createRes.ok) {
            throw new Error(`Create Failed: ${createRes.status} ${createRes.statusText}`);
        }

        const workflowData = await createRes.json();
        const workflowId = workflowData.id;
        console.log(`[Test] Workflow Created: ${workflowId}`);

        // 2. Execute Workflow
        console.log('[Test] Executing Workflow...');
        const execRes = await fetch(`${API_Base}/api/workflows/${workflowId}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input: 'Run Test' })
        });

        if (!execRes.ok) {
            throw new Error(`Execute Failed: ${execRes.status} ${execRes.statusText}`);
        }

        const execData = await execRes.json();
        console.log('[Test] Execution Result:', execData.status);

        // 3. Verify Steps
        if (execData.steps && execData.steps.length > 0) {
            console.log(`[Test] Steps Captured: ${execData.steps.length}`);
            execData.steps.forEach((step, index) => {
                console.log(`Step ${index + 1}: Node ${step.nodeId} - ${step.status} (${step.duration}ms)`);
            });
        } else {
            console.error('[Test] FAILED: No execution steps returned!');
            console.log('Response:', JSON.stringify(execData, null, 2));
        }

        // Cleanup
        // await fetch(`${API_Base}/workflows/${workflowId}`, { method: 'DELETE' });

    } catch (error) {
        console.error('[Test] Error:', error.message);
    }
}

testWorkflowExecution();
