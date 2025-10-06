// FINAL FRONTEND - Ready for Railway Backend
const CONFIG = {
    // ✅ Your Railway backend URL (port 8080 confirmed working)
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

// Safe URL builder to prevent double slashes
function buildUrl(baseUrl, endpoint) {
    const cleanBase = baseUrl.replace(/\/$/, '');
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
    return cleanBase + cleanEndpoint;
}

class KolamApp {
    constructor() {
        this.defaultColors = {
            diamond: '#e377c2', corners: '#1f77b4', fish: '#ff7f0e',
            waves: '#2ca02c', fractal: '#9467bd', organic: '#8c564b'
        };

        this.currentImageData = null;
        this.isGenerating = false;
        this.backendStatus = 'unknown';

        this.initializeElements();
        this.bindEvents();
        this.updateInitialValues();
        this.checkBackendConnection();

        console.log(`🎨 Kolam Generator initialized`);
        console.log(`🔧 Backend: ${CONFIG.API_BASE_URL}`);
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
        this.addQuickInfo();
    }

    addStatusIndicator() {
        const statusDiv = document.createElement('div');
        statusDiv.id = 'backendStatus';
        statusDiv.style.cssText = `
            position: fixed; top: 10px; right: 10px; padding: 8px 12px;
            border-radius: 6px; font-size: 12px; font-weight: bold;
            z-index: 1000; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            background: #fff3cd; color: #856404;
        `;
        statusDiv.textContent = '🔄 Connecting...';
        document.body.appendChild(statusDiv);
        this.statusIndicator = statusDiv;
    }

    addQuickInfo() {
        const infoDiv = document.createElement('div');
        infoDiv.style.cssText = `
            position: fixed; bottom: 10px; left: 10px; padding: 8px 12px;
            background: rgba(0,0,0,0.8); color: white; font-size: 10px;
            border-radius: 4px; font-family: monospace; z-index: 1000;
        `;
        infoDiv.innerHTML = `
            <strong>Railway Backend:</strong><br>
            ${CONFIG.API_BASE_URL}<br>
            <a href="${CONFIG.API_BASE_URL}/api/health" target="_blank" style="color: #00ff00;">Test Health</a>
        `;
        document.body.appendChild(infoDiv);
    }

    updateBackendStatus(status, message) {
        this.backendStatus = status;
        if (!this.statusIndicator) return;

        const styles = {
            connected: { bg: '#d4edda', text: '#155724', icon: '✅' },
            disconnected: { bg: '#f8d7da', text: '#721c24', icon: '❌' },
            checking: { bg: '#fff3cd', text: '#856404', icon: '🔄' }
        };

        const style = styles[status] || styles.checking;
        this.statusIndicator.style.backgroundColor = style.bg;
        this.statusIndicator.style.color = style.text;
        this.statusIndicator.textContent = `${style.icon} ${message}`;
    }

    async checkBackendConnection() {
        this.updateBackendStatus('checking', 'Testing Railway backend...');

        try {
            const healthUrl = buildUrl(CONFIG.API_BASE_URL, CONFIG.API_ENDPOINTS.HEALTH);
            console.log(`🔍 Testing: ${healthUrl}`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUTS.HEALTH_CHECK);

            const response = await fetch(healthUrl, {
                method: 'GET',
                signal: controller.signal,
                mode: 'cors',
                headers: { 'Content-Type': 'application/json' }
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Railway backend connected:', result);
                this.updateBackendStatus('connected', 'Railway Connected');
                this.showReadyMessage();
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

        } catch (error) {
            console.error('❌ Backend connection failed:', error);
            this.updateBackendStatus('disconnected', 'Connection Failed');
            this.showConnectionError(error);
        }
    }

    showReadyMessage() {
        this.previewArea.innerHTML = `
            <div style="text-align: center; padding: 40px; border: 2px solid #28a745; border-radius: 8px; background: #d4edda;">
                <h2 style="color: #155724; margin-top: 0;">🎉 Kolam Generator Ready!</h2>
                <p style="color: #155724;">Your Railway backend is connected and working perfectly.</p>
                <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 6px;">
                    <strong style="color: #495057;">✨ Ready to Generate Beautiful Kolam Patterns!</strong><br>
                    <span style="font-size: 14px; color: #6c757d;">
                    Choose your parameters on the left and click "Generate Kolam"
                    </span>
                </div>
                <div style="font-size: 12px; color: #6c757d; margin-top: 15px;">
                    <strong>Backend:</strong> ${CONFIG.API_BASE_URL}<br>
                    <strong>Status:</strong> Healthy and operational
                </div>
            </div>
        `;
    }

    showConnectionError(error) {
        const errorType = error.name === 'AbortError' ? 'Connection Timeout' :
                         error.message.includes('ERR_NAME_NOT_RESOLVED') ? 'DNS Error' :
                         'Network Error';

        this.previewArea.innerHTML = `
            <div style="padding: 20px; border: 2px dashed #dc3545; border-radius: 8px; background: #f8d7da;">
                <h3 style="color: #721c24; margin-top: 0;">🔌 Connection Failed</h3>
                <p style="color: #721c24;"><strong>Error:</strong> ${errorType}</p>
                <p style="color: #721c24;"><strong>Backend:</strong> ${CONFIG.API_BASE_URL}</p>

                <div style="margin: 15px 0; padding: 12px; background: #fff3cd; border-radius: 4px;">
                    <strong style="color: #856404;">🔧 Try This:</strong><br>
                    <span style="color: #856404; font-size: 14px;">
                    1. <a href="${CONFIG.API_BASE_URL}/api/health" target="_blank">Test backend directly</a><br>
                    2. Check if Railway app is running<br>
                    3. Refresh this page and try again
                    </span>
                </div>

                <button onclick="window.kolamApp.checkBackendConnection()" 
                        style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    🔄 Retry Connection
                </button>
            </div>
        `;
    }

    bindEvents() {
        window.kolamApp = this;

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
            alert('❌ Backend not connected. Please wait for connection or refresh the page.');
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
                    <div style="font-size: 32px; margin-bottom: 15px;">🎨</div>
                    <div style="font-size: 18px; margin-bottom: 10px;">Creating Your Kolam...</div>
                    <div style="font-size: 14px; color: #666;">
                        ${params.one_stroke ? 'One-stroke generation may take up to 2 minutes' : 'This should complete within 30 seconds'}
                    </div>
                    <div style="margin-top: 20px; width: 200px; height: 4px; background: #f0f0f0; border-radius: 2px; margin: 20px auto; overflow: hidden;">
                        <div style="width: 100%; height: 100%; background: linear-gradient(90deg, #007bff, #28a745); animation: pulse 1.5s ease-in-out infinite;"></div>
                    </div>
                </div>
                <style>
                @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
                </style>
            `;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const generateUrl = buildUrl(CONFIG.API_BASE_URL, CONFIG.API_ENDPOINTS.GENERATE);
            console.log(`🚀 Generating kolam:`, params);

            const response = await fetch(generateUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
                console.log('✅ Kolam generated successfully!');
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
        img.alt = `Generated ${result.boundary_type} Kolam Pattern`;
        img.style.cssText = 'max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';

        const info = document.createElement('div');
        info.style.cssText = 'text-align: center; margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;';
        info.innerHTML = `
            <div style="display: flex; justify-content: space-around; flex-wrap: wrap;">
                <div><strong>Boundary:</strong> ${result.boundary_type}</div>
                <div><strong>Paths:</strong> ${result.path_count}</div>
                <div><strong>Type:</strong> ${result.is_one_stroke ? 'One-stroke ✨' : 'Multi-stroke'}</div>
                <div><strong>Time:</strong> ${result.generation_time}s</div>
            </div>
            <div style="margin-top: 10px; color: #28a745; font-weight: bold;">
                🎉 ${result.message || 'Beautiful kolam generated successfully!'}
            </div>
        `;

        this.previewArea.innerHTML = '';
        this.previewArea.appendChild(img);
        this.previewArea.appendChild(info);
    }

    showGenerationError(error) {
        let errorMsg = 'Generation failed';
        if (error.name === 'AbortError') {
            errorMsg = 'Generation timeout - try smaller parameters or disable one-stroke';
        } else if (error.message.includes('ERR_NAME_NOT_RESOLVED')) {
            errorMsg = 'Lost connection to backend - please refresh page';
        } else {
            errorMsg = error.message;
        }

        this.previewArea.innerHTML = `
            <div style="padding: 20px; border: 2px dashed #dc3545; border-radius: 8px; background: #f8d7da;">
                <h3 style="color: #721c24; margin-top: 0;">❌ Generation Failed</h3>
                <p style="color: #721c24;">${errorMsg}</p>
                <div style="margin-top: 15px; padding: 10px; background: #fff3cd; border-radius: 4px;">
                    <strong style="color: #856404;">💡 Suggestions:</strong><br>
                    <span style="color: #856404; font-size: 14px;">
                    • Try smaller ND values (11-15)<br>
                    • Use lower sigma values (0.3-0.6)<br>
                    • Disable one-stroke for faster generation<br>
                    • Refresh page if connection issues persist
                    </span>
                </div>
            </div>
        `;
    }

    setGenerating(isGenerating) {
        this.isGenerating = isGenerating;
        this.generateBtn.disabled = isGenerating;
        this.generateBtn.textContent = isGenerating ? '🔄 Generating...' : '🎨 Generate Kolam';

        // Disable form during generation
        this.form.querySelectorAll('input, select').forEach(input => {
            input.disabled = isGenerating;
        });
    }

    handleDownload() {
        if (!this.currentImageData) {
            alert('No kolam to download. Please generate one first!');
            return;
        }

        const params = this.getFormParameters();
        const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '');
        const filename = `kolam-${params.boundary_type}-${params.ND}-${timestamp}.png`;

        const link = document.createElement('a');
        link.download = filename;
        link.href = this.currentImageData;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Initialize the Kolam Generator
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎨 Starting Kolam Generator...');
    console.log(`🚀 Backend: ${CONFIG.API_BASE_URL}`);
    new KolamApp();
});
