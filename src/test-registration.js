import fetch from 'node-fetch';

const testRegistration = async () => {
  const testUser = {
    username: 'testuser123',
    email: 'testuser123@example.com',
    password: 'Test123!@#',
    fullName: 'Test User'
  };

  try {
    console.log('Attempting to register user:', { ...testUser, password: '***' });
    
    const response = await fetch('http://localhost:5001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });

    const data = await response.json();

    if (response.ok) {
      console.log('Registration successful!');
      console.log('Response data:', {
        ...data,
        token: data.token ? 'Token received' : 'No token'
      });
    } else {
      console.log('Registration failed!');
      console.log('Error:', data.message);
    }
  } catch (error) {
    console.error('Error during registration test:', error);
  }
};

// Запускаем тест
testRegistration(); 