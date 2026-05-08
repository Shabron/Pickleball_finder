import { API_BASE_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const TOKEN_KEY = '@auth_token';

export const setToken = async (token: string) => {
  await AsyncStorage.setItem(TOKEN_KEY, token);
};

export const getToken = async () => {
  return await AsyncStorage.getItem(TOKEN_KEY);
};

export const clearToken = async () => {
  await AsyncStorage.removeItem(TOKEN_KEY);
};

export const authApi = {
  login: async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to login');
      }

      return await response.json();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  signup: async (name: string, email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to sign up');
      }

      return await response.json();
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  },

  /** Validate the stored token — returns user data or throws if expired/invalid */
  getMe: async () => {
    const token = await getToken();
    if (!token) throw new Error('No token stored');

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Token invalid');
    }

    return await response.json();
  },
};

export const profileApi = {
  getProfile: async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/profile/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  getProfileByUserId: async (userId: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/profile/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch user profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  },

  updateProfile: async (data: any) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/profile/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  uploadAvatar: async (imageUri: string, type: string, fileName: string) => {
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append('avatar', {
        uri: imageUri,
        type: type,
        name: fileName,
      } as any);

      const response = await fetch(`${API_BASE_URL}/profile/me/avatar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to upload avatar');
      }

      return await response.json();
    } catch (error) {
      console.error('Upload avatar error:', error);
      throw error;
    }
  },
};

export const postApi = {
  getPosts: async (params?: any) => {
    try {
      const token = await getToken();
      const query = params ? new URLSearchParams(params).toString() : '';
      const response = await fetch(`${API_BASE_URL}/posts${query ? `?${query}` : ''}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch posts');
      }

      return await response.json();
    } catch (error) {
      console.error('Get posts error:', error);
      throw error;
    }
  },

  getPostById: async (id: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch post');
      }

      return await response.json();
    } catch (error) {
      console.error('Get post by id error:', error);
      throw error;
    }
  },

  getMyPosts: async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/posts/my`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch my posts');
      }

      return await response.json();
    } catch (error) {
      console.error('Get my posts error:', error);
      throw error;
    }
  },

  createPost: async (data: any) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create post');
      }

      return await response.json();
    } catch (error) {
      console.error('Create post error:', error);
      throw error;
    }
  },

  updatePost: async (id: string, data: any) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update post');
      }

      return await response.json();
    } catch (error) {
      console.error('Update post error:', error);
      throw error;
    }
  },

  getReplies: async (postId: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/posts/${postId}/replies`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch replies');
      }

      return await response.json();
    } catch (error) {
      console.error('Get replies error:', error);
      throw error;
    }
  },

  addReply: async (postId: string, content: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/posts/${postId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to add reply');
      }

      return await response.json();
    } catch (error) {
      console.error('Add reply error:', error);
      throw error;
    }
  },
};

export const matchmakingApi = {
  getNearbyPlayers: async (params: { lat: number; lng: number; radiusKm?: number; skillLevel?: string; playStyle?: string; limit?: number }) => {
    try {
      const token = await getToken();
      const queryParams = new URLSearchParams();
      if (params.lat !== undefined) queryParams.append('lat', params.lat.toString());
      if (params.lng !== undefined) queryParams.append('lng', params.lng.toString());
      if (params.radiusKm !== undefined) queryParams.append('radiusKm', params.radiusKm.toString());
      if (params.skillLevel !== undefined) queryParams.append('skillLevel', params.skillLevel);
      if (params.playStyle !== undefined) queryParams.append('playStyle', params.playStyle);
      if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());

      const queryStr = queryParams.toString();
      const response = await fetch(`${API_BASE_URL}/matchmaking/nearby${queryStr ? `?${queryStr}` : ''}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch nearby players');
      }

      return await response.json();
    } catch (error) {
      console.error('Get nearby players error:', error);
      throw error;
    }
  },
};

export const messageApi = {
  getConversations: async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/messages/conversations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch conversations');
      }

      return await response.json();
    } catch (error) {
      console.error('Get conversations error:', error);
      throw error;
    }
  },

  getMessages: async (conversationId: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/messages/${conversationId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch messages');
      }

      return await response.json();
    } catch (error) {
      console.error('Get messages error:', error);
      throw error;
    }
  },

  sendMessage: async (receiverId: string, content: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ receiverId, content }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to send message');
      }

      return await response.json();
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  },

  markAsRead: async (conversationId: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/messages/${conversationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to mark messages as read');
      }

      return await response.json();
    } catch (error) {
      console.error('markAsRead error:', error);
      throw error;
    }
  },
};

