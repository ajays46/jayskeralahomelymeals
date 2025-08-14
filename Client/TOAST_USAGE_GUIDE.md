# 🎉 Toast Notification System - Usage Guide

This guide explains how to use the comprehensive toast notification system throughout your project.

## 🚀 Quick Start

### 1. Import Toast Functions
```javascript
import { 
  showSuccessToast, 
  showErrorToast, 
  showWarningToast,
  showInfoToast 
} from '../utils/toastConfig.jsx';
```

### 2. Basic Usage
```javascript
// Success toast
showSuccessToast('Operation completed successfully!', 'Success!');

// Error toast
showErrorToast('Something went wrong', 'Error!');

// Warning toast
showWarningToast('Please check your input', 'Warning!');

// Info toast
showInfoToast('Here is some information', 'Info');
```

## 📱 Toast Types & Functions

### 🟢 Success Toasts
```javascript
// General success
showSuccessToast('Your message', 'Optional Title');

// Specific success toasts
showOrderSuccess('Order created successfully!');
showPaymentSuccess('Payment processed!');
showAddressSuccess('Address saved!');
showMenuSuccess('Menu updated!');
showProductSuccess('Product saved!');
showUserSuccess('User updated!');
showUserCreated('New user created!');
showUploadSuccess('File uploaded!');
showSaved('Your changes');
showUpdated('User profile');
showDeleted('Selected item');
showCopiedToClipboard('Text');
```

### 🔴 Error Toasts
```javascript
// General error
showErrorToast('Error message', 'Error Title');

// Specific error toasts
showOrderError('Failed to create order');
showPaymentError('Payment failed');
showAddressError('Failed to save address');
showMenuError('Failed to update menu');
showProductError('Failed to save product');
showUserError('Failed to update user');
showUploadError('File upload failed');
showNetworkError('Connection lost');
showApiError(errorObject);
```

### 🟡 Warning Toasts
```javascript
// General warning
showWarningToast('Warning message', 'Warning Title');

// Specific warning toasts
showFileTooLarge('10MB');
showValidationError('Please check your input');
showRequiredFieldError('Email address');
```

### 🔵 Info Toasts
```javascript
// General info
showInfoToast('Information message', 'Info Title');
```

## 🔄 Processing Toasts

### Show Loading Toast
```javascript
const toastId = showProcessing('Processing your request...');

// Later, update the toast
updateProcessingToast(toastId, 'Request completed!', 'success');
```

### Update Processing Toast
```javascript
// Update with success
updateProcessingToast(toastId, 'Success!', 'success');

// Update with error
updateProcessingToast(toastId, 'Failed!', 'error');

// Update with warning
updateProcessingToast(toastId, 'Warning!', 'warning');

// Update with info
updateProcessingToast(toastId, 'Info!', 'info');
```

## 🧹 Toast Management

### Dismiss Specific Toast
```javascript
dismissToast(toastId);
```

### Dismiss All Toasts
```javascript
dismissAllToasts();
```

## 📍 Real-World Examples

### 1. Form Submission
```javascript
const handleSubmit = async () => {
  try {
    const toastId = showProcessing('Submitting form...');
    
    const response = await submitForm(formData);
    
    if (response.success) {
      updateProcessingToast(toastId, 'Form submitted successfully!', 'success');
      // Redirect or update UI
    } else {
      updateProcessingToast(toastId, 'Submission failed', 'error');
    }
  } catch (error) {
    showApiError(error);
  }
};
```

### 2. API Error Handling
```javascript
try {
  const response = await apiCall();
  // Handle success
} catch (error) {
  if (error.response?.status === 401) {
    showErrorToast('Please login again', 'Session Expired');
    // Redirect to login
  } else if (error.response?.status === 403) {
    showErrorToast('You do not have permission', 'Access Denied');
  } else if (error.response?.status >= 500) {
    showNetworkError('Server error. Please try again later.');
  } else {
    showApiError(error);
  }
}
```

### 3. File Upload
```javascript
const handleFileUpload = (file) => {
  if (file.size > 5 * 1024 * 1024) { // 5MB
    showFileTooLarge('5MB');
    return;
  }
  
  try {
    // Upload logic
    showUploadSuccess('File uploaded successfully!');
  } catch (error) {
    showUploadError('Failed to upload file');
  }
};
```

### 4. Validation Errors
```javascript
const validateForm = () => {
  if (!email) {
    showRequiredFieldError('Email address');
    return false;
  }
  
  if (!isValidEmail(email)) {
    showValidationError('Please enter a valid email address');
    return false;
  }
  
  return true;
};
```

### 5. User Actions
```javascript
const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(text);
    showCopiedToClipboard('Text');
  } catch (error) {
    showErrorToast('Failed to copy text', 'Copy Failed');
  }
};

const handleSave = async () => {
  try {
    await saveData();
    showSaved('Your changes');
  } catch (error) {
    showErrorToast('Failed to save changes', 'Save Failed');
  }
};
```

## 🎨 Customization

### Toast Configuration
The toast configuration is in `src/utils/toastConfig.jsx`. You can modify:

- Position: `top-right`, `top-left`, `bottom-right`, `bottom-left`, `top-center`, `bottom-center`
- Auto-close duration
- Theme: `light`, `dark`, `colored`
- Progress bar
- Draggable behavior

### Custom Styling
Each toast type has custom CSS classes that you can override in your CSS:

```css
/* Custom success toast styling */
.Toastify__toast--success {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

/* Custom error toast styling */
.Toastify__toast--error {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}
```

## 🔧 Integration with Existing Code

### Replace Old Toast Calls
```javascript
// Old way
import { toast } from 'react-toastify';
toast.success('Success message');
toast.error('Error message');

// New way
import { showSuccessToast, showErrorToast } from '../utils/toastConfig.jsx';
showSuccessToast('Success message');
showErrorToast('Error message');
```

### Update Error Handling
```javascript
// Old way
} catch (error) {
  toast.error(error.message || 'An error occurred');
}

// New way
} catch (error) {
  showApiError(error);
}
```

## 📱 Mobile Responsiveness

The toast system is fully responsive and works well on all device sizes. Toasts automatically adjust their positioning and sizing based on screen size.

## 🚨 Best Practices

1. **Use Specific Toast Functions**: Instead of generic `showSuccessToast`, use specific functions like `showOrderSuccess` for better context.

2. **Provide Clear Messages**: Make toast messages concise and actionable.

3. **Handle Errors Gracefully**: Always catch errors and show appropriate toast messages.

4. **Use Processing Toasts**: For long-running operations, show processing toasts and update them with results.

5. **Don't Spam**: Avoid showing too many toasts at once. Use `dismissAllToasts()` if needed.

6. **Consistent Messaging**: Use consistent language and tone across all toast messages.

## 🎯 Common Use Cases

- **Form submissions** (success/error)
- **API calls** (loading/success/error)
- **File uploads** (progress/success/error)
- **User actions** (copy, save, delete)
- **Validation errors** (field validation)
- **Network issues** (connection errors)
- **Authentication** (login/logout success/error)

## 🔍 Troubleshooting

### Toast Not Showing
1. Check if `ToastContainer` is properly set up in `main.jsx`
2. Verify imports are correct
3. Check browser console for errors

### Toast Styling Issues
1. Ensure `react-toastify/dist/ReactToastify.css` is imported
2. Check for CSS conflicts
3. Verify custom CSS classes

### Toast Position Issues
1. Check toast configuration in `toastConfig.jsx`
2. Verify responsive breakpoints
3. Test on different screen sizes

## 📚 Additional Resources

- [React-Toastify Documentation](https://fkhadra.github.io/react-toastify/)
- [Toast Configuration Options](https://fkhadra.github.io/react-toastify/api/toast)
- [Custom Toast Components](https://fkhadra.github.io/react-toastify/components)

---

**Happy Toasting! 🎉** 

Use this system to provide excellent user feedback throughout your application!
