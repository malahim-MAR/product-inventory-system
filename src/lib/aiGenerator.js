// AI Description Generator using Google Gemini API
// Note: Requires VITE_GEMINI_API_KEY in environment variables

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

/**
 * Generate a product description using AI
 * @param {string} productName - The name of the product
 * @param {string} category - The product category
 * @param {object} options - Additional options like keywords, tone, length
 * @returns {Promise<string>} - Generated description
 */
export async function generateProductDescription(productName, category = '', options = {}) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
        // Fallback to template-based generation if no API key
        return generateTemplateDescription(productName, category, options);
    }

    const { keywords = [], tone = 'professional', length = 'medium' } = options;

    const lengthGuide = {
        short: '2-3 sentences',
        medium: '4-5 sentences',
        long: '6-8 sentences'
    };

    const prompt = `Generate a compelling product description for an e-commerce listing.

Product Name: ${productName}
${category ? `Category: ${category}` : ''}
${keywords.length > 0 ? `Key Features: ${keywords.join(', ')}` : ''}
Tone: ${tone}
Length: ${lengthGuide[length]}

Requirements:
- Make it engaging and persuasive for customers
- Highlight key benefits and features
- Use ${tone} language
- Keep it concise and scannable
- Do not include the product name at the start
- Do not use markdown formatting

Return only the description text, nothing else.`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 500,
                }
            })
        });

        if (!response.ok) {
            throw new Error('API request failed');
        }

        const data = await response.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
            throw new Error('No text generated');
        }

        return generatedText.trim();
    } catch (error) {
        console.error('AI generation error:', error);
        // Fallback to template
        return generateTemplateDescription(productName, category, options);
    }
}

/**
 * Template-based description generator (fallback when no API key)
 */
function generateTemplateDescription(productName, category = '', options = {}) {
    const { keywords = [], tone = 'professional' } = options;

    const templates = {
        Electronics: [
            `Experience cutting-edge technology with our ${productName}. Designed for modern users who demand performance and reliability, this product delivers exceptional quality in every use. Perfect for both professional and personal applications, it combines innovative features with user-friendly design.`,
            `Elevate your tech experience with the ${productName}. Built with precision engineering and premium components, it offers outstanding performance that meets the demands of today's digital lifestyle. A smart investment for anyone seeking quality and dependability.`
        ],
        Clothing: [
            `Make a statement with our ${productName}. Crafted from premium materials with attention to detail, this piece combines style and comfort effortlessly. Perfect for any occasion, it's designed to make you look and feel your best.`,
            `Discover timeless elegance with the ${productName}. Made with quality fabrics and expert craftsmanship, it offers a perfect blend of fashion and functionality. A must-have addition to your wardrobe.`
        ],
        Food: [
            `Indulge in the exceptional quality of our ${productName}. Made with carefully selected ingredients and crafted to perfection, it delivers an unforgettable taste experience. Perfect for those who appreciate quality and authentic flavors.`,
            `Savor the difference with ${productName}. Prepared using traditional methods and premium ingredients, it brings restaurant-quality taste to your table. A delicious choice for food enthusiasts.`
        ],
        default: [
            `Discover the excellence of our ${productName}. Designed with quality and functionality in mind, it meets the highest standards of performance and durability. An essential addition that delivers outstanding value for your investment.`,
            `Introducing the ${productName} – where quality meets innovation. Carefully crafted to exceed expectations, it offers exceptional features and reliable performance. Perfect for those who never compromise on quality.`
        ]
    };

    const categoryTemplates = templates[category] || templates.default;
    const template = categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)];

    // Add keywords if provided
    if (keywords.length > 0) {
        return template + ` Key features include ${keywords.join(', ')}.`;
    }

    return template;
}

/**
 * Generate SEO-friendly keywords from product info
 */
export async function generateKeywords(productName, category = '', description = '') {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
        // Simple keyword extraction
        const words = `${productName} ${category} ${description}`.toLowerCase().split(/\s+/);
        return [...new Set(words.filter(w => w.length > 3))].slice(0, 10);
    }

    const prompt = `Extract 5-10 SEO-friendly keywords for this product:
Product: ${productName}
Category: ${category}
Description: ${description}

Return only a comma-separated list of keywords, nothing else.`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.3 }
            })
        });

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return text.split(',').map(k => k.trim()).filter(k => k.length > 0);
    } catch (error) {
        console.error('Keyword generation error:', error);
        return [];
    }
}

export default { generateProductDescription, generateKeywords };
