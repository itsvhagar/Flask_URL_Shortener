function showCreate() {
    document.getElementById('createContent').style.display = 'block';
    document.getElementById('manageContent').style.display = 'none';
    document.getElementById('accountContent').style.display = 'none';
}

function showManage() {
    document.getElementById('createContent').style.display = 'none';
    document.getElementById('manageContent').style.display = 'block';
    document.getElementById('accountContent').style.display = 'none';
}

function showAccount() {
    document.getElementById('createContent').style.display = 'none';
    document.getElementById('manageContent').style.display = 'none';
    document.getElementById('accountContent').style.display = 'block';
}

// Add event listeners
window.onload = function() {
    document.getElementById('btnCreateNew').addEventListener('click', showCreate);
    document.getElementById('btnManageLinks').addEventListener('click', showManage);
    document.getElementById('btnSettings').addEventListener('click', showAccount);
};
// Function to select all checkboxes
function selectAll(source) {
    checkboxes = document.querySelectorAll('.userCheckbox');
    for (var i = 0, n = checkboxes.length; i < n; i++) {
    checkboxes[i].checked = source.checked;
    }
}

function deleteLink(linkid, rowElement) {
    fetch('/delete-link', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        linkID: linkid
    })
    })
    .then(function(response) {
    // Check if the response status is OK (200)
    if (response.ok) {
        // Parse the response JSON, assuming it's a JSON response
        return response.json();
    } else {
        // If the server's response is not OK, throw an error
        throw new Error('Server responded with status: ' + response.status);
    }
    })
    .then(function(data) {
    // Handle the data from the successful response
    console.log(data);
    // Assuming your API returns a responseCode where 0 means success
    if (data.responseCode == 0) {
        // Remove the user from the table
        if (rowElement && rowElement.parentNode) {
        rowElement.parentNode.removeChild(rowElement);
        } else {
        console.error('No row element provided or the row is not in the DOM');
        }
    } else {
        // Handle any other response codes or messages from your API
        alert('Error: ' + data.message);
    }
    })
    .catch(function(error) {
    // Handle any errors that occurred during the fetch
    console.error('Error:', error);
    });
}


// Function to delete selected users
function deleteSelectedLinks() {
    // Get all checked checkboxes with the class 'userCheckbox'
    var selectedCheckboxes = document.querySelectorAll('.userCheckbox:checked');
    var linkIdsToDelete = Array.from(selectedCheckboxes).map(function(checkbox) {
    return checkbox.value; // assuming the value of the checkbox is the userID
    });

    // Check if any users are selected
    if (linkIdsToDelete.length === 0) {
    alert('No users selected.');
    return;
    }

    // Confirm with the user
    if (!confirm('Are you sure you want to delete ' + linkIdsToDelete.length + ' selected links?')) {
    return;
    }

    // Logic to delete all selected users
    fetch('/delete-selected-links', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        linkIDs: linkIdsToDelete
    })
    })
    .then(function(response) {
    // Check if the response status is OK (200)
    if (response.ok) {
        return response.json();
    } else {
        throw new Error('Server responded with status: ' + response.status);
    }
    })
    .then(function(data) {
    if (data.responseCode === 0) {
        // Remove the users from the table
        selectedCheckboxes.forEach(function(checkbox) {
        var row = checkbox.closest('tr');
        if (row) {
            row.remove();
        }
        });
        alert('Links successfully deleted.');
    } else {
        // Handle any other response codes or messages from your API
        alert('Error: ' + data.message);
    }
    })
    .catch(function(error) {
    // Handle any errors that occurred during the fetch
    console.error('Error:', error);
    alert('An error occurred while deleting links.');
    });
}

function makeEditable(button, linkid) {
    var destinationCell = document.querySelector('td.destination[data-linkid="' + linkid + '"]');
    var currentText = destinationCell.textContent;
    destinationCell.innerHTML = '<input type="text" class="editDestination" value="' + currentText + '">';
    button.textContent = 'Save';
    button.setAttribute('onclick', 'saveLink(\'' + linkid + '\', this)');
}

function saveLink(linkid, button) {
    var destinationCell = document.querySelector('td.destination[data-linkid="' + linkid + '"]');
    var inputField = destinationCell.querySelector('.editDestination');
    var newDestination = inputField.value;
    fetch('/update-link', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        linkID: linkid,
        newDestination: newDestination
    })
    })
    .then(function(response) {
    if (response.ok) {
        return response.json();
    } else {
        throw new Error('Server responded with status: ' + response.status);
    }
    })
    .then(function(data) {
    // If the server update is successful, reflect the change on the page
    destinationCell.textContent = newDestination;
    button.textContent = 'Update Link';
    button.setAttribute('onclick', 'makeEditable(\'' + linkid + '\', this)');
    })
    .catch(function(error) {
    console.error('Error:', error);
    alert('An error occurred while updating the link.');
    });
}

// Change password
document.addEventListener('DOMContentLoaded', function() {
    const changePasswordForm = document.getElementById('changePasswordForm');
    const passwordError = document.querySelector('.password-error');
  
  
    changePasswordForm.addEventListener('submit', function(event) {
      event.preventDefault(); // Prevent the default form submission behavior
      // Get the form values
      const userID = document.getElementById('userID').value;
      console.log(userID);
      const oldPassword = document.getElementById('oldPassword').value;
      const newPassword = document.getElementById('newPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      
      // Check if the new password and confirm password match
      if (newPassword !== confirmPassword) {
        passwordError.textContent = 'New Passwords do not match.';
        return;
      }
  
      // Create a data object to send in the request
      const data = {
        user_id: userID,
        new_password: newPassword,
        old_password: oldPassword
      };
  
      // Make an AJAX request to the server
      fetch('/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then(function(response) {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error('Server responded with status: ' + response.status);
        }
      })
      .then(function(data) {
        if (data.responseCode == 1) {
          passwordError.textContent = data.value;
        }
        else {
          passwordError.style.color = '#00FF00';
          passwordError.textContent = data.value;
        }
      })
      .catch(function(error) {
        console.error('Error:', error);
        alert('An error occurred.');
      });
    });
  });