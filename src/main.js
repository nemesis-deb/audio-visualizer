import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

/**
 * Vue App Entry Point
 * 
 * This file initializes the Vue application with Pinia state management.
 * The audio system (renderer.js or renderer-new.js) is loaded via script tag
 * in index.html before this module, ensuring all globals are available.
 */
try {
  const app = createApp(App);
  const pinia = createPinia();

  app.use(pinia);
  app.mount('#app');
  
  console.log('✓ Vue app mounted successfully');
  
  // Log available globals for debugging (only in development)
  if (import.meta.env.DEV) {
    setTimeout(() => {
      console.log('Available globals:');
      console.log('  - window.spectra:', !!window.spectra);
      console.log('  - window.visualizerManager:', !!window.visualizerManager);
      console.log('  - window.audioManager:', !!window.audioManager);
      console.log('  - window.audioContext:', !!window.audioContext);
      console.log('  - window.analyser:', !!window.analyser);
    }, 1000);
  }
} catch (error) {
  console.error('✗ Error mounting Vue app:', error);
  
  // Show error in UI
  const appDiv = document.getElementById('app');
  if (appDiv) {
    appDiv.innerHTML = `
      <div style="padding: 40px; color: white; font-family: Arial; text-align: center;">
        <h1>Error Loading App</h1>
        <p>${error.message}</p>
        <p style="margin-top: 20px; color: #888;">
          Make sure you're running the app through Vite dev server:<br/>
          <code style="background: #333; padding: 5px 10px; border-radius: 3px;">npm run dev</code><br/>
          Then in another terminal:<br/>
          <code style="background: #333; padding: 5px 10px; border-radius: 3px;">npm start</code>
        </p>
        <pre style="margin-top: 20px; text-align: left; background: #222; padding: 15px; border-radius: 5px; overflow-x: auto;">
${error.stack}
        </pre>
      </div>
    `;
  }
}
