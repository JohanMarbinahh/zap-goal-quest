import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./stores/store";
import { initNDK, setupAuth } from "@/lib/ndk";
import App from "./App.tsx";
import "./index.css";

const initializeApp = async () => {
  try {
    console.log('🔄 Redux state rehydrated, initializing NDK...');
    await initNDK();
    await setupAuth();
    console.log('✅ App initialization complete');
  } catch (error) {
    console.error('❌ Failed to initialize app:', error);
  }
};

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor} onBeforeLift={initializeApp}>
      <App />
    </PersistGate>
  </Provider>
);
