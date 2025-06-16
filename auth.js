// AWS Cognito Authentication Service
class AuthService {
  constructor() {
    this.currentUser = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.idToken = null;
    this.cognitoUser = null;
    
    // Don't auto-initialize in constructor to avoid race conditions
    // initializeAuth() will be called explicitly by the app
  }

  /**
   * initialize authentication on app start
   */
  async initializeAuth() {
    try {
      // check if we have stored tokens
      const storedTokens = this.getStoredTokens();
      if (storedTokens && storedTokens.accessToken) {
        this.setTokens(storedTokens);
        
        // validate token and get user info
        const userInfo = await this.getCurrentUser();
        if (userInfo) {
          this.currentUser = userInfo;
          return true;
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      this.clearAuth();
    }
    return false;
  }

  /**
   * sign up a new user
   */
  async signUp(email, password, name) {
    try {
      const response = await fetch(`https://cognito-idp.${CONFIG.AUTH.REGION}.amazonaws.com/`, {
        method: 'POST',
        headers: {
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.SignUp',
          'Content-Type': 'application/x-amz-json-1.1'
        },
        body: JSON.stringify({
          ClientId: CONFIG.AUTH.CLIENT_ID,
          Username: email,
          Password: password,
          UserAttributes: [
            {
              Name: 'email',
              Value: email
            },
            {
              Name: 'name',
              Value: name
            }
          ]
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Sign up failed');
      }

      return {
        success: true,
        userSub: data.UserSub,
        confirmationRequired: !data.UserConfirmed
      };
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  /**
   * confirm sign up with verification code
   */
  async confirmSignUp(email, confirmationCode) {
    try {
      const response = await fetch(`https://cognito-idp.${CONFIG.AUTH.REGION}.amazonaws.com/`, {
        method: 'POST',
        headers: {
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.ConfirmSignUp',
          'Content-Type': 'application/x-amz-json-1.1'
        },
        body: JSON.stringify({
          ClientId: CONFIG.AUTH.CLIENT_ID,
          Username: email,
          ConfirmationCode: confirmationCode
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Confirmation failed');
      }

      return { success: true };
    } catch (error) {
      console.error('Confirmation error:', error);
      throw error;
    }
  }

  /**
   * sign in user
   */
  async signIn(email, password) {
    try {
      const response = await fetch(`https://cognito-idp.${CONFIG.AUTH.REGION}.amazonaws.com/`, {
        method: 'POST',
        headers: {
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
          'Content-Type': 'application/x-amz-json-1.1'
        },
        body: JSON.stringify({
          AuthFlow: 'USER_PASSWORD_AUTH',
          ClientId: CONFIG.AUTH.CLIENT_ID,
          AuthParameters: {
            USERNAME: email,
            PASSWORD: password
          }
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Sign in failed');
      }

      if (data.AuthenticationResult) {
        const tokens = {
          accessToken: data.AuthenticationResult.AccessToken,
          idToken: data.AuthenticationResult.IdToken,
          refreshToken: data.AuthenticationResult.RefreshToken
        };

        this.setTokens(tokens);
        this.storeTokens(tokens);

        // get user info
        this.currentUser = await this.getCurrentUser();
        
        return {
          success: true,
          user: this.currentUser
        };
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  /**
   * sign out user
   */
  async signOut() {
    try {
      if (this.accessToken) {
        await fetch(`https://cognito-idp.${CONFIG.AUTH.REGION}.amazonaws.com/`, {
          method: 'POST',
          headers: {
            'X-Amz-Target': 'AWSCognitoIdentityProviderService.GlobalSignOut',
            'Content-Type': 'application/x-amz-json-1.1'
          },
          body: JSON.stringify({
            AccessToken: this.accessToken
          })
        });
      }
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      this.clearAuth();
    }
  }

  /**
   * get current user from API
   */
  async getCurrentUser() {
    try {
      if (!this.accessToken) {
        return null;
      }

      const response = await fetch(CONFIG.getApiUrl(CONFIG.API.ENDPOINTS.AUTH_ME), {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return await response.json();
      } else if (response.status === 401) {
        // token expired or invalid
        this.clearAuth();
        return null;
      }
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * refresh access token
   */
  async refreshAccessToken() {
    try {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`https://cognito-idp.${CONFIG.AUTH.REGION}.amazonaws.com/`, {
        method: 'POST',
        headers: {
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
          'Content-Type': 'application/x-amz-json-1.1'
        },
        body: JSON.stringify({
          AuthFlow: 'REFRESH_TOKEN_AUTH',
          ClientId: CONFIG.AUTH.CLIENT_ID,
          AuthParameters: {
            REFRESH_TOKEN: this.refreshToken
          }
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Token refresh failed');
      }

      if (data.AuthenticationResult) {
        const tokens = {
          accessToken: data.AuthenticationResult.AccessToken,
          idToken: data.AuthenticationResult.IdToken,
          refreshToken: this.refreshToken // refresh token stays the same
        };

        this.setTokens(tokens);
        this.storeTokens(tokens);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearAuth();
      return false;
    }
  }

  /**
   * check if user is authenticated
   */
  isAuthenticated() {
    return !!(this.accessToken && this.currentUser);
  }

  /**
   * get authorization header value
   */
  getAuthHeader() {
    return this.accessToken ? `Bearer ${this.accessToken}` : null;
  }

  /**
   * set tokens in memory
   */
  setTokens(tokens) {
    this.accessToken = tokens.accessToken;
    this.idToken = tokens.idToken;
    this.refreshToken = tokens.refreshToken;
  }

  /**
   * store tokens in localStorage
   */
  storeTokens(tokens) {
    try {
      localStorage.setItem('fcc_auth_tokens', JSON.stringify(tokens));
    } catch (error) {
      console.error('Failed to store tokens:', error);
    }
  }

  /**
   * get stored tokens from localStorage
   */
  getStoredTokens() {
    try {
      const stored = localStorage.getItem('fcc_auth_tokens');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to get stored tokens:', error);
      return null;
    }
  }

  /**
   * clear all authentication data
   */
  clearAuth() {
    this.currentUser = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.idToken = null;
    
    try {
      localStorage.removeItem('fcc_auth_tokens');
    } catch (error) {
      console.error('Failed to clear stored tokens:', error);
    }
  }
}

// create global auth service instance
const authService = new AuthService();

// make it globally available
if (typeof window !== 'undefined') {
  window.authService = authService;
} 