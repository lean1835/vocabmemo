import React from "react";
import { Provider } from "react-redux";
import { store } from "./stores/store";
import { AppThemeProvider } from "./providers/AppThemeProvider";
import { AppRouter } from "./routers/AppRouter";

export const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppThemeProvider>
        <AppRouter />
      </AppThemeProvider>
    </Provider>
  );
};

export default App;
