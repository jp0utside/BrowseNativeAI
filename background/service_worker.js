console.log('BrowseNativeAI Service Worker Loaded');

//Listen for messages from content script
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     console.log('Service worker received message: ', request.action);

//     if (request.action == 'generateModifications') {
//         handleGenerateModifications(request, sender)
//             .then(sendResponse)
//             .catch(error => {
//                 console.error('Error in service worker: ', error);
//                 sendResponse({ error: error.message });
//             })
//         return true;
//     }
// })

// async function handleGenerateModifications(request, sender) {
//     const { pageAnalysis, preset } = request;

//     console.log('Generating Modifications For: ', pageAnalysis.domain, preset);

//     //Check for API Key
//     const result = await chrome.storage.local.get('anthropic_api_key');
//     const apiKey = result.anthropic_ai_key;

//     if (!apiKey) {
//         console.log('No API key found, using simple mode');
//         return {
//             modifications: getSimplePreset(preset),
//             fromCache: false,
//             isSimple: true
//         }
//     }

//     //Check cache first
//     const cacheKey = `cache_${pageAnalysis.domain}_${preset}`;
//     const cached = await chrome.storage.local.get(cacheKey);

//     if (cached[cacheKey]) {
//         console.log('Returning cached modifications');
//         return {
//             modifications: cached[cacheKey].modifications,
//             fromCache: true
//         }
//     }

//     //Call API
//     console.log("Calling Claude API...");
//     try {
//         const modifications = await callClaudeAPI(pageAnalysis, preset, apiKey);

//         //Cache the result
//         await chrome.storage.local.set({
//             [cacheKey]: {
//                 modifications: modifications,
//                 timestamp: Date.now()
//             }
//         });

//         return {
//             modifications: modifications,
//             fromCache: false
//         };
//     } catch (error) {
//         console.error("API call failed: ", error);

//         //Fallback to simple mode preset
//         return {
//             modifications: getSimplePreset(preset),
//             fromCache: false,
//             isSimple: true,
//             error: error.message
//         };
//     }
// }

// async function callClaudeAPI(pageAnalysis, preset, apiKey) {
//     const prompt = buildPrompt(pageAnalysis, preset);

//     const response = await fetch('https://api.anthropic.com/v1/messages', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//             'x-API-key': apiKey,
//             'anthropic-version': '2023-06-01'
//         },
//         body: JSON.stringify({
//             model: 'claude-sonnet-4-5-20250929',
//             max_tokens: 2000,
//             messages: [{
//                 role: 'user',
//                 content: prompt
//             }]
//         })
//     })

//     if (!response.ok) {
//         const error = await response.json();
//         throw new Error(`API Error ${error.error?.message || 'Unknown error'}`);
//     }

//     const data = await response.json();
//     const responseText = data.content[0].text;

//     //Parse JSON response
//     return parseClaudeResponse(responseText);
// }

// function buildPrompt(pageAnalysis, preset) {
//     const presetInstructions = {
//         'large-text': `Make text larger and more readable:
//             - Body text: minimum 18px
//             - Headings: scale proportionately (h1: 32px, h2: 28px, h3: 24px)
//             - Increase line-height to 1.6 for body text
//             - Ensure buttons and links remain readable`,
//         'high-contrast': `Improve contrast for better visibility:
//             - Ensure text has at least a 7:1 contrast ratio
//             - Make buttons and interactive elements stand out
//             - Add borders to clarify boundaries
//             - Consider the current color scheme`
//     };

//     return `You are an expert in web accessibility and CSS. Generate CSS modifications for this webpage.
//         pageAnalysis: ${JSON.stringify(pageAnalysis, null, 2)}
//         Preset: ${preset}
//         ${presetInstructions[preset] || ''}
//         CRITICAL: Return ONLY valid JSON in this exact format (no markdown, no code blocks):
//         {
//             "css": "body * { font-size: 18px !important; }",
//             "description": "Brief description of changes"
//         }
//         RULES:
//         - Use !important to override existing styles
//         - Maintain visual hierarchy
//         - Don't break layouts
//         - Be specific with selectors

//         Return only the JSON, nothing else.`;
// }

// function parseClaudeResponse(responseText) {
//     try {
//         //Try to extract json if wrapped in code blocks
//         let jsonText = responseText;

//         const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/);
//         if (jsonMatch) {
//             jsonText = jsonMatch[1];
//         } else {
//             const codeMatch = responseText.match(/```\n?([\s\S]*?)\n?```/);
//             if (codeMatch) {
//                 jsonText = codeMatch[1];
//             }
//         }

//         const parsed = JSON.parse(jsonText.trim());
//         return parsed;
//     } catch (error) {
//         console.throw('Failed to parse Claude response: ', responseText);
//         throw new Error('Invalid response format from Claude');
//     }
// }

// function getSimplePreset(preset) {
//     const presets = {
//         'large-text': {
//             css: `
//                 body * {
//                     font-size: 18px !important;
//                     line-height: 1.6 !important;
//                 }
//                 h1 { font-size: 32px !important; }
//                 h2 { font-size: 28px !important; }
//                 h3 { font-size: 24px !important; }
//                 button, a {
//                     font-size: 18px !important;
//                     padding: 12px !important;
//                 }
//             `,
//             description: 'Simple large text preset (no AI)'
//         },
//         'high-contrast': {
//             css: `
//                 body {
//                     background: #000 !important;
//                     color: #fff !important;
//                 }
//                 a {
//                     color: #4da6ff !important;
//                     text-decoration: underline !important;
//                 }
//                 button {
//                     background: #fff !important;
//                     color: #000 !important;
//                     border: 2px solid #fff !important;
//                 }
//             `,
//             description: 'Simple high contrast preset (no AI)'
//         }
//     };
      
//     return presets[preset] || presets['large-text'];
// }