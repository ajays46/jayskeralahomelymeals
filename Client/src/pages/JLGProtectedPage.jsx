import React from 'react';
import AccountSetupPage from './AccountSetupPage';

/**
 * JLG protected page entrypoint.
 * Reuses account-setup flow but keeps a distinct URL for JLG users.
 */
const JLGProtectedPage = () => {
  return <AccountSetupPage variant="jlg" />;
};

export default JLGProtectedPage;
