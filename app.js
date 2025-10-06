// Fixed app.js - RESOLVES DOUBLE SLASH URL BUG
const CONFIG = {
    // ✅ NO trailing slash to prevent double slashes
    API_BASE_URL: 'https://web-production-06d8.up.railway.app',
    API_ENDPOINTS: {
        GENERATE: '/api/generate',
        HEALTH: '/api/health',
        TEST: '/api/test'
    },
    TIMEOUTS: {
        HEALTH_CHECK: 10000,
        REGULAR_GENERATION: 45000,
        ONE_STROKE_GENERATION: 120000
    }
};

// ✅ SAFE URL BUILDER - Prevents double slashes
function buildUrl(baseUrl, endpoint) {
    // Remove trailing slash from base, leading slash from endpoint if both exist
    const cleanBase = baseUrl.replace(/\/$/, '');
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
    return cleanBase + cleanEndpoint;
}

class KolamApp {
    constructor() {
        this.defaultColors = {
            diamond: '#e377c2',
            corners: '#1f77b4',
            fish: '#ff7f0e',
            waves: '#2ca02c',
            fractal: '#9467bd',
            organic: '#8c564b'
        };

        this.currentImageData = null;
        this.isGenerating = false;
        this.backendStatus = 'unknown';

        this.initializeElements();
        this.bindEvents();
        this.updateInitialValues();
        this.checkBackendConnection();

        console.log(`🔧 Backend URL configured: ${CONFIG.API_BASE_URL}`);
        console.log(`🔧 Health URL will be: ${buildUrl(CONFIG.API_BASE_URL, CONFIG.API_ENDPOINTS.HEALTH)}`);
    }

    initializeElements() {
        this.form = document.getElementById('kolamForm');
        this.ndSlider = document.getElementById('ndSlider');
        this.ndValue = document.getElementById('ndValue');
        this.sigmaSlider = document.getElementById('sigmaSlider');
        this.sigmaValue = document.getElementById('sigmaValue');
        this.boundaryType = document.getElementById('boundaryType');
        this.kolamColor = document.getElementById('kolamColor');
        this.colorValue = document.getElementById('colorValue');
        this.oneStroke = document.getElementById('oneStroke');
        this.themeRadios = document.querySelectorAll('input[name="theme"]');

        this.generateBtn = document.getElementById('generateBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.previewArea = document.getElementById('previewArea');

        this.addStatusIndicator();
        this.addDebugInfo();
    }

    addStatusIndicator() {
        const statusDiv = document.createElement('div');
        statusDiv.id = 'backendStatus';
        statusDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: bold;
            z-index: 1000;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            background: #fff3cd;
            color: #856404;
        `;
        statusDiv.textContent = '🔄 Checking...';
        document.body.appendChild(statusDiv);
        this.statusIndicator = statusDiv;
    }

    addDebugInfo() {
        const debugDiv = document.createElement('div');
        debugDiv.style.cssText = `
            position: fixed;
            bottom: 10px;
            left: 10px;
            padding: 8px 12px;
            background: rgba(0,0,0,0.8);
            color: white;
            font-size: 10px;
            border-radius: 4px;
            font-family: monospace;
            max-width: 400px;
            z-index: 1000;
        `;

        const healthUrl = buildUrl(CONFIG.API_BASE_URL, CONFIG.API_ENDPOINTS.HEALTH);
        debugDiv.innerHTML = `
            <strong>Debug Info:</strong><br>
            Base URL: ${CONFIG.API_BASE_URL}<br>
            Health URL: ${healthUrl}<br>
            <a href="${healthUrl}" target="_blank" style="color: #00ff00;">🔗 Test Health</a>
        `;
        document.body.appendChild(debugDiv);
    }

    updateBackendStatus(status, message) {
        this.backendStatus = status;
        if (!this.statusIndicator) return;

        const colors = {
            connected: { bg: '#d4edda', text: '#155724', icon: '✅' },
            disconnected: { bg: '#f8d7da', text: '#721c24', icon: '❌' },
            checking: { bg: '#fff3cd', text: '#856404', icon: '🔄' }
        };

        const style = colors[status] || colors.checking;
        this.statusIndicator.style.backgroundColor = style.bg;
        this.statusIndicator.style.color = style.text;
        this.statusIndicator.textContent = `${style.icon} ${message}`;
    }

    async checkBackendConnection() {
        this.updateBackendStatus('checking', 'Testing connection...');

        try {
            // ✅ FIXED: Use safe URL builder
            const healthUrl = buildUrl(CONFIG.API_BASE_URL, CONFIG.API_ENDPOINTS.HEALTH);
            console.log(`🔍 Testing backend connection to: ${healthUrl}`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUTS.HEALTH_CHECK);

            const response = await fetch(healthUrl, {
                method: 'GET',
                signal: controller.signal,
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Backend connection successful:', result);
                this.updateBackendStatus('connected', 'Backend Connected');
                this.showSuccess();
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

        } catch (error) {
            console.error('❌ Backend connection failed:', error);
            this.updateBackendStatus('disconnected', 'Connection Failed');
            this.showConnectionError(error);
        }
    }

    showSuccess() {
        this.previewArea.innerHTML = `
            <div style="text-align: center; padding: 40px; border: 2px solid #28a745; border-radius: 8px; background: #d4edda;">
                <h2 style="color: #155724; margin-top: 0;">✅ Backend Connected!</h2>
                <p style="color: #155724;">Your kolam generator is ready to use.</p>
                <p style="font-size: 14px; color: #155724;">
                    <strong>Backend:</strong> ${CONFIG.API_BASE_URL}<br>
                    <strong>Status:</strong> Healthy and accessible
                </p>
                <div style="margin-top: 20px;">
                    <p style="color: #495057;">👈 Adjust parameters and click "Generate Kolam" to create beautiful patterns!</p>
                </div>
            </div>
        `;
    }

    showConnectionError(error) {
        const errorType = error.name === 'AbortError' ? 'Connection Timeout' :
                         error.message.includes('ERR_NAME_NOT_RESOLVED') ? 'DNS Resolution Failed' :
                         error.message.includes('Failed to fetch') ? 'Network Error' :
                         error.message;

        this.previewArea.innerHTML = `
            <div style="padding: 20px; border: 2px dashed #dc3545; border-radius: 8px; background: #f8d7da;">
                <h3 style="color: #721c24; margin-top: 0;">🔌 Connection Failed</h3>
                <p style="color: #721c24;"><strong>Error:</strong> ${errorType}</p>
                <p style="color: #721c24;"><strong>Backend URL:</strong> ${CONFIG.API_BASE_URL}</p>

                <div style="margin: 15px 0; padding: 10px; background: #fff3cd; border-radius: 4px;">
                    <strong style="color: #856404;">🔧 Quick Fixes:</strong><br>
                    <span style="color: #856404; font-size: 14px;">
                    1. <a href="${buildUrl(CONFIG.API_BASE_URL, CONFIG.API_ENDPOINTS.HEALTH)}" target="_blank">Test backend health directly</a><br>
                    2. Check if Railway app is sleeping (visit backend URL)<br>
                    3. Verify no typos in backend URL<br>
                    4. Try refreshing this page
                    </span>
                </div>

                <button onclick="window.kolamApp.checkBackendConnection()" 
                        style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    🔄 Test Connection Again
                </button>
            </div>
        `;
    }

    bindEvents() {
        window.kolamApp = this; // For button callbacks

        this.ndSlider.addEventListener('input', (e) => this.updateNDValue(e.target.value));
        this.sigmaSlider.addEventListener('input', (e) => this.updateSigmaValue(e.target.value));
        this.boundaryType.addEventListener('change', (e) => this.updateDefaultColor(e.target.value));
        this.kolamColor.addEventListener('input', (e) => this.updateColorValue(e.target.value));

        this.form.addEventListener('submit', (e) => this.handleGenerate(e));
        this.generateBtn.addEventListener('click', (e) => this.handleGenerate(e));
        this.downloadBtn.addEventListener('click', () => this.handleDownload());

        this.themeRadios.forEach(radio => {
            radio.addEventListener('change', () => this.updateTheme());
        });
    }

    updateNDValue(value) { this.ndValue.textContent = value; }
    updateSigmaValue(value) { this.sigmaValue.textContent = value; }
    updateDefaultColor(boundaryType) {
        const defaultColor = this.defaultColors[boundaryType] || '#1f77b4';
        this.kolamColor.value = defaultColor;
        this.updateColorValue(defaultColor);
    }
    updateColorValue(color) { this.colorValue.textContent = color; }
    updateInitialValues() {
        this.updateNDValue(this.ndSlider.value);
        this.updateSigmaValue(this.sigmaSlider.value);
        this.updateDefaultColor(this.boundaryType.value);
    }
    updateTheme() {
        const selectedTheme = document.querySelector('input[name="theme"]:checked').value;
        document.body.setAttribute('data-theme', selectedTheme);
    }

    async handleGenerate(e) {
        e.preventDefault();

        if (this.isGenerating) return;

        if (this.backendStatus !== 'connected') {
            alert('❌ Backend is not connected. Please wait for connection or refresh the page.');
            return;
        }

        const params = this.getFormParameters();
        await this.generateKolam(params);
    }

    getFormParameters() {
        const selectedTheme = document.querySelector('input[name="theme"]:checked')?.value || 'light';
        return {
            ND: parseInt(this.ndSlider.value),
            sigmaref: parseFloat(this.sigmaSlider.value),
            boundary_type: this.boundaryType.value,
            theme: selectedTheme,
            kolam_color: this.kolamColor.value,
            one_stroke: this.oneStroke.checked
        };
    }

    async generateKolam(params) {
        try {
            this.setGenerating(true);

            const timeout = params.one_stroke ? 
                CONFIG.TIMEOUTS.ONE_STROKE_GENERATION : 
                CONFIG.TIMEOUTS.REGULAR_GENERATION;

            this.previewArea.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 24px; margin-bottom: 10px;">🎨</div>
                    <div>Generating ${params.one_stroke ? 'one-stroke' : 'multi-stroke'} kolam...</div>
                    <div style="font-size: 12px; color: #666; margin-top: 5px;">Please wait 10-30 seconds</div>
                </div>
            `;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            // ✅ FIXED: Use safe URL builder
            const generateUrl = buildUrl(CONFIG.API_BASE_URL, CONFIG.API_ENDPOINTS.GENERATE);
            console.log(`Making API call to: ${generateUrl}`);

            const response = await fetch(generateUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params),
                signal: controller.signal,
                mode: 'cors'
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();

            if (result.success) {
                this.displayKolam(result);
                this.currentImageData = result.image;
                this.downloadBtn.disabled = false;
                console.log('✅ Kolam generated successfully');
            } else {
                throw new Error(result.error || 'Generation failed');
            }

        } catch (error) {
            console.error('❌ Generation error:', error);
            this.showGenerationError(error);
        } finally {
            this.setGenerating(false);
        }
    }

    displayKolam(result) {
        const img = document.createElement('img');
        img.src = result.image;
        img.alt = 'Generated Kolam Pattern';
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.borderRadius = '8px';

        const info = document.createElement('div');
        info.style.textAlign = 'center';
        info.style.marginTop = '15px';
        info.innerHTML = `
            <div style="display: inline-block; background: #f8f9fa; padding: 10px; border-radius: 6px;">
                <strong>Paths:</strong> ${result.path_count} | 
                <strong>Type:</strong> ${result.is_one_stroke ? 'One-stroke ✨' : 'Multi-stroke'} |
                <strong>Time:</strong> ${result.generation_time || 'N/A'}s
            </div>
        `;

        this.previewArea.innerHTML = '';
        this.previewArea.appendChild(img);
        this.previewArea.appendChild(info);
    }

    showGenerationError(error) {
        let errorMsg = 'Generation failed';
        if (error.name === 'AbortError') {
            errorMsg = 'Generation timeout - try smaller parameters';
        } else if (error.message.includes('ERR_NAME_NOT_RESOLVED')) {
            errorMsg = 'Backend connection lost - check backend status';
        } else {
            errorMsg = error.message;
        }

        this.previewArea.innerHTML = `
            <div style="padding: 20px; border: 2px dashed #dc3545; border-radius: 8px; background: #f8d7da;">
                <h3 style="color: #721c24; margin-top: 0;">❌ Generation Failed</h3>
                <p style="color: #721c24;">${errorMsg}</p>
                <div style="margin-top: 10px; font-size: 14px; color: #856404;">
                    <strong>Try:</strong><br>
                    • Smaller ND values (11-15)<br>
                    • Disable one-stroke mode<br>
                    • Refresh page and retry
                </div>
            </div>
        `;
    }

    setGenerating(isGenerating) {
        this.isGenerating = isGenerating;
        this.generateBtn.disabled = isGenerating;
        this.generateBtn.textContent = isGenerating ? '🔄 Generating...' : '🎨 Generate Kolam';
    }

    handleDownload() {
        if (!this.currentImageData) {
            alert('No image to download. Please generate a kolam first.');
            return;
        }

        const params = this.getFormParameters();
        const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '');
        const filename = `kolam-${params.boundary_type}-${params.ND}-${timestamp}.png`;

        const link = document.createElement('a');
        link.download = filename;
        link.href = this.currentImageData;
        link.click();
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎨 Initializing Kolam Generator App...');
    console.log(`📡 Backend configured for: ${CONFIG.API_BASE_URL}`);
    new KolamApp();
});
