import { useState, useCallback } from 'react';

// You will need to get these from the Google Cloud Console (https://console.cloud.google.com/)
// 1. Create a project
// 2. Enable Google Drive API and Google Picker API
// 3. Create OAuth 2.0 Client ID and an API Key
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const APP_ID = import.meta.env.VITE_GOOGLE_APP_ID || '';

// Scope for Google Drive (read-only access to files chosen by the user)
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

export const useGoogleDrive = () => {
    const [isLoaded, setIsLoaded] = useState(false);

    // Load the Google API and Picker scripts
    const loadPicker = useCallback(() => {
        return new Promise((resolve) => {
            if (window.google) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => {
                window.gapi.load('auth2', () => {
                    window.gapi.load('picker', () => {
                        setIsLoaded(true);
                        resolve(true);
                    });
                });
            };
            document.body.appendChild(script);
        });
    }, []);

    const openPicker = useCallback(async (onSelect: (url: string, name: string) => void) => {
        if (!window.gapi) await loadPicker();

        // 1. Authenticate user
        const googleAuth = window.gapi.auth2.getAuthInstance() || await window.gapi.auth2.init({
            client_id: CLIENT_ID,
            scope: SCOPES,
        });

        const user = await googleAuth.signIn();
        const authResponse = user.getAuthResponse(true);
        const token = authResponse.access_token;

        if (token) {
            // 2. Initialize Picker
            const view = new window.google.picker.View(window.google.picker.ViewId.DOCS);
            view.setMimeTypes('video/mp4,video/quicktime,video/x-msvideo,video/x-matroska');

            const picker = new window.google.picker.PickerBuilder()
                .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
                .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
                .setAppId(APP_ID)
                .setOAuthToken(token)
                .addView(view)
                .setDeveloperKey(API_KEY)
                .setCallback((data: any) => {
                    if (data[window.google.picker.Response.ACTION] === window.google.picker.Action.PICKED) {
                        const file = data[window.google.picker.Response.DOCUMENTS][0];
                        const url = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
                        onSelect(url, file.name);
                    }
                })
                .build();

            picker.setVisible(true);
        }
    }, [loadPicker]);

    return { openPicker, isLoaded };
};
