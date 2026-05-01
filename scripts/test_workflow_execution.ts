
import axios from 'axios';

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

        const createRes = await axios.post(`${API_Base}/workflows`, workflow);
        const workflowId = createRes.data.id;
        console.log(`[Test] Workflow Created: ${workflowId}`);

        // 2. Execute Workflow
        console.log('[Test] Executing Workflow...');
        const execRes = await axios.post(`${API_Base}/workflows/${workflowId}/execute`, {
            input: 'Run Test'
        });

        console.log('[Test] Execution Result:', execRes.data.status);

        // 3. Verify Steps
        if (execRes.data.steps && execRes.data.steps.length > 0) {
            console.log(`[Test] Steps Captured: ${execRes.data.steps.length}`);
            execRes.data.steps.forEach((step, index) => {
                console.log(`Step ${index + 1}: Node ${step.nodeId} - ${step.status} (${step.duration}ms)`);
            });
        } else {
            console.error('[Test] FAILED: No execution steps returned!');
        }

        // Cleanup
        // await axios.delete(`${API_Base}/workflows/${workflowId}`);

    } catch (error) {
        console.error('[Test] Error:', error.response?.data || error.message);
    }
}

testWorkflowExecution();
