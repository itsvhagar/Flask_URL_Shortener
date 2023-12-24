function showManage() {
  document.getElementById('manageUsers').style.display = 'block';
  document.getElementById('accountContent').style.display = 'none';
}

function showAccount() {
  document.getElementById('manageUsers').style.display = 'none';
  document.getElementById('accountContent').style.display = 'block';
}

// Add event listeners
window.onload = function() {
  document.getElementById('btnManageUser').addEventListener('click', showManage);
  document.getElementById('btnSettings').addEventListener('click', showAccount);
};
// Function to select all checkboxes
function selectAll(source) {
  checkboxes = document.querySelectorAll('.userCheckbox');
  for (var i = 0, n = checkboxes.length; i < n; i++) {
    checkboxes[i].checked = source.checked;
  }
}

// Function to view user's links
function viewLinks(userid) {
  var myModal = document.getElementById('myModal');
  myModal.style.display = 'block';
  fetch('/get-all-links', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({
          userID: userid
      })
    })
    .then(function(response) {
      // Check if the response status is OK (200)
      if (response.ok) {
        // Parse the response JSON, assuming it's a JSON response
        return response.json();
      } else {
        // Handle error responses here
        throw new Error('Failed to fetch data');
      }
    })
    .then(function(data) {
      // Handle the data from the successful response
      console.log(data);
      populateLinkTable(data);
    })
    .catch(function(error) {
      // Handle any errors that occurred during the fetch
      console.error(error);
    });

}

// Function to delete a user
function deleteUser(userid, rowElement) {
  // Logic to delete the user
  alert('Deleted ' + userid);
  fetch('/delete-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userID: userid
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
function deleteSelectedUsers() {
  // Get all checked checkboxes with the class 'userCheckbox'
  var selectedCheckboxes = document.querySelectorAll('.userCheckbox:checked');
  var userIdsToDelete = Array.from(selectedCheckboxes).map(function(checkbox) {
    return checkbox.value; // assuming the value of the checkbox is the userID
  });

  // Check if any users are selected
  if (userIdsToDelete.length === 0) {
    alert('No users selected.');
    return;
  }

  // Confirm with the user
  if (!confirm('Are you sure you want to delete ' + userIdsToDelete.length + ' selected users?')) {
    return;
  }

  // Logic to delete all selected users
  fetch('/delete-selected-users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userIDs: userIdsToDelete
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
      alert('Users successfully deleted.');
    } else {
      // Handle any other response codes or messages from your API
      alert('Error: ' + data.message);
    }
  })
  .catch(function(error) {
    // Handle any errors that occurred during the fetch
    console.error('Error:', error);
    alert('An error occurred while deleting users.');
  });
}


    // Function to close the modal popup
function closeModal() {
  var modal = document.getElementById('myModal');
  modal.style.display = 'none';
}
function populateLinkTable(links) {
  var linkListPopup = document.getElementById('linkListPopup');

  // Clear existing rows
  linkListPopup.innerHTML = '';

  // Iterate through the links and create table rows
  for (var i = 0; i < links.length; i++) {
    var link = links[i];

    var row = document.createElement('tr');

    // Create table cells and set their content
    var linkCheckBox = document.createElement('td');
    linkCheckBox.style="padding:10px; text-align:center;";
    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'userCheckbox';
    checkbox.value = link.id;
    linkCheckBox.appendChild(checkbox);
    var linkIdCell = document.createElement('td');
    linkIdCell.style="padding:10px; text-align:center;";
    var urlCell = document.createElement('td');
    urlCell.style="padding:10px; text-align:center;";
    var destinationCell = document.createElement('td');
    destinationCell.style="padding:10px; text-align:center; word-wrap: break-word;";
    destinationCell.className = "destination"
    destinationCell.setAttribute('data-linkid', link.id);
    destinationCell.setAttribute('id', link.id);
    var openCell = document.createElement('td');
    openCell.style="padding:10px; text-align:center;";
    var actionsCell = document.createElement('td');
    actionsCell.style="padding:10px; text-align:center;";
    
    linkIdCell.textContent = link.id;
    urlCell.textContent = link.short_url;
    destinationCell.textContent = link.long_url;
    openCell.textContent = link.open_count;

    // Create action buttons for each link
    var updateButton = document.createElement('button');
    updateButton.type = 'button';
    updateButton.textContent = 'Update Link';
    updateButton.className = 'updateLinksButton';
    updateButton.setAttribute('data-linkid', link.id);
    updateButton.style = "padding:5px 10px; margin-right:5px; background-color:#4CAF50; color:white; border:none; border-radius:4px; cursor:pointer;";
    // updateButton.addEventListener('click', function() {
    //   makeEditable(this, this.getAttribute('data-linkid'));
    // });
    updateButton.addEventListener('click', makeEditableListener);
    var deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.className = 'deleteLinkButton';
    deleteButton.setAttribute('data-linkid', link.id);
    deleteButton.style = "padding:5px 10px; background-color:#f44336; color:white; border:none; border-radius:4px; cursor:pointer;";
    deleteButton.addEventListener('click', function() {
      deleteLink(this.getAttribute('data-linkid'), this.closest('tr'));
    });

    actionsCell.appendChild(updateButton);
    actionsCell.appendChild(deleteButton);
    
    row.appendChild(linkCheckBox);
    row.appendChild(linkIdCell);
    row.appendChild(urlCell);
    row.appendChild(destinationCell);
    row.appendChild(openCell);
    row.appendChild(actionsCell);

    linkListPopup.appendChild(row);
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
// This is a wrapper for makeEditable to be used in addEventListener
function makeEditableListener(event) {
  var button = event.target;
  var linkid = button.getAttribute('data-linkid');
  makeEditable(button, linkid);
}

function makeEditable(button, linkid) {
  var destinationCell = document.querySelector('td.destination[data-linkid="' + linkid + '"]');
  var currentText = destinationCell.textContent;
  destinationCell.innerHTML = '<input type="text" class="editDestination" value="' + currentText + '">';
  button.textContent = 'Save';
  // Remove the initial 'makeEditable' event listener
  button.removeEventListener('click', makeEditableListener);
  // Update the event listener to saveLink when saving
  button.addEventListener('click', function(event) {
    saveLink(this, linkid, event); // Passing event object here
  });
}

function saveLink(button, linkid, event) {
  event.preventDefault();
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