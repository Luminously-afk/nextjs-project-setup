// Store records in memory
let records = [];
let editIndex = -1;
let currentStep = 1;
const totalSteps = 5;

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registrationForm');
    const errorMessage = document.getElementById('errorMessage');
    const reviewInfo = document.getElementById('reviewInfo');

    // Setup navigation buttons
    for (let i = 1; i <= totalSteps; i++) {
        const nextBtn = document.getElementById(`nextBtn${i}`);
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (validateStep(i)) {
                    if (i < totalSteps) {
                        showStep(i + 1);
                    } else {
                        // On last step's next, show review info
                        showStep(totalSteps);
                    }
                }
            });
        }
    }

    for (let i = 2; i <= totalSteps; i++) {
        const prevBtn = document.getElementById(`prevBtn${i}`);
        if (prevBtn) {
            prevBtn.addEventListener('click', () => showStep(i - 1));
        }
    }

    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (validateAllSteps()) {
            handleFormSubmit();
        }
    });

    function validateStep(step) {
        const requiredFields = {
            1: ['fullName', 'dob', 'gender', 'birthAddress', 'currentAddress'],
            2: ['motherName', 'fatherName', 'contactNumber'],
            3: ['primaryIdNumber', 'placeOfIssue', 'dateOfIssue', 'expiryDate', 'issuingAuthority', 'documentType'],
            4: ['nationality', 'maritalStatus', 'occupation', 'email', 'emergencyContact'],
            5: []
        };

        // If we're on step 4 and clicking next to review, skip field validation
        if (step === 4 && currentStep === 4) {
            return true;
        }

        const fields = requiredFields[step] || [];
        const emptyFields = fields.filter(field => !document.getElementById(field).value.trim());

        if (emptyFields.length > 0) {
            showMessage(`Please fill in all required fields in Step ${step}`, 'error');
            return false;
        }

        // Additional validations
        if (step === 2) {
            const contactNumber = document.getElementById('contactNumber').value.trim();
            if (!/^[0-9\+\-\s]+$/.test(contactNumber)) {
                showMessage('Please enter a valid phone number', 'error');
                return false;
            }
        }

        if (step === 3) {
            const dateOfIssue = new Date(document.getElementById('dateOfIssue').value);
            const expiryDate = new Date(document.getElementById('expiryDate').value);
            
            if (expiryDate <= dateOfIssue) {
                showMessage('Expiry date must be after date of issue', 'error');
                return false;
            }
        }

        if (step === 4 && currentStep !== 4) {
            const email = document.getElementById('email').value.trim();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                showMessage('Please enter a valid email address', 'error');
                return false;
            }

            const emergencyContact = document.getElementById('emergencyContact').value.trim();
            if (!/^[0-9\+\-\s]+$/.test(emergencyContact)) {
                showMessage('Please enter a valid emergency contact number', 'error');
                return false;
            }
        }

        return true;
    }

    function validateAllSteps() {
        for (let i = 1; i <= totalSteps - 1; i++) {
            if (!validateStep(i)) {
                showStep(i);
                return false;
            }
        }
        return true;
    }

    function updateReviewInfo() {
        if (currentStep === totalSteps) {
            const data = gatherFormData();
            reviewInfo.innerHTML = `
                <div class="review-section">
                    <h4><i class="fas fa-user"></i> Personal Information</h4>
                    <p><strong>Full Name:</strong> ${data.fullName}</p>
                    <p><strong>Date of Birth:</strong> ${formatDate(data.dob)}</p>
                    <p><strong>Gender:</strong> ${capitalizeFirstLetter(data.gender)}</p>
                    <p><strong>Birth Place:</strong> ${data.birthAddress}</p>
                    <p><strong>Current Address:</strong> ${data.currentAddress}</p>
                    <p><strong>Nationality:</strong> ${data.nationality}</p>
                    <p><strong>Marital Status:</strong> ${capitalizeFirstLetter(data.maritalStatus)}</p>
                    <p><strong>Occupation:</strong> ${data.occupation}</p>
                </div>
                <div class="review-section">
                    <h4><i class="fas fa-users"></i> Contact Information</h4>
                    <p><strong>Email:</strong> ${data.email}</p>
                    <p><strong>Contact Number:</strong> ${data.contactNumber}</p>
                    <p><strong>Emergency Contact:</strong> ${data.emergencyContact}</p>
                </div>
                <div class="review-section">
                    <h4><i class="fas fa-heart"></i> Family Information</h4>
                    <p><strong>Mother's Name:</strong> ${data.motherName}</p>
                    <p><strong>Father's Name:</strong> ${data.fatherName}</p>
                </div>
                <div class="review-section">
                    <h4><i class="fas fa-file-alt"></i> Document Information</h4>
                    <p><strong>Document Type:</strong> ${capitalizeFirstLetter(data.documentType)}</p>
                    <p><strong>Primary ID:</strong> ${data.primaryIdNumber}</p>
                    <p><strong>Secondary ID 1:</strong> ${data.secondaryIdNumber1 || 'Not provided'}</p>
                    <p><strong>Secondary ID 2:</strong> ${data.secondaryIdNumber2 || 'Not provided'}</p>
                    <p><strong>Place of Issue:</strong> ${data.placeOfIssue}</p>
                    <p><strong>Date of Issue:</strong> ${formatDate(data.dateOfIssue)}</p>
                    <p><strong>Expiry Date:</strong> ${formatDate(data.expiryDate)}</p>
                    <p><strong>Issuing Authority:</strong> ${data.issuingAuthority}</p>
                </div>
            `;
        }
    }

    // Initialize
    showStep(1);
    renderTable();
});

function renderTable() {
    const tableBody = document.getElementById('recordsTableBody');
    
    if (records.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="no-records">No records found</td></tr>';
        return;
    }

    tableBody.innerHTML = records.map((record, index) => `
        <tr>
            <td>${record.nationalIdNumber || 'To be issued'}</td>
            <td>${record.fullName}</td>
            <td>${formatDate(record.dob)}</td>
            <td>${capitalizeFirstLetter(record.gender)}</td>
            <td><span class="status-badge status-${record.status?.toLowerCase() || 'pending'}">${record.status || 'Pending'}</span></td>
            <td>
                <button onclick="editRecord(${index})" class="action-btn edit-btn">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button onclick="deleteRecord(${index})" class="action-btn delete-btn">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
            <td>
                <button onclick="viewDetails(${index})" class="action-btn view-btn" title="View Full Details">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function viewDetails(index) {
    const record = records[index];
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    modal.innerHTML = `
        <div class="modal-content scrollable">
            <h3><i class="fas fa-id-card"></i> ${record.fullName}'s Details</h3>
            <div class="details-grid">
                <div class="details-section">
                    <h4><i class="fas fa-user"></i> Personal Information</h4>
                    <p><strong>National ID Number:</strong> ${record.nationalIdNumber || 'To be issued'}</p>
                    <p><strong>Status:</strong> ${record.status || 'Pending'}</p>
                    <p><strong>Full Name:</strong> ${record.fullName}</p>
                    <p><strong>Date of Birth:</strong> ${formatDate(record.dob)}</p>
                    <p><strong>Gender:</strong> ${capitalizeFirstLetter(record.gender)}</p>
                    <p><strong>Birth Place:</strong> ${record.birthAddress}</p>
                    <p><strong>Current Address:</strong> ${record.currentAddress}</p>
                    <p><strong>Nationality:</strong> ${record.nationality}</p>
                    <p><strong>Marital Status:</strong> ${capitalizeFirstLetter(record.maritalStatus)}</p>
                    <p><strong>Occupation:</strong> ${record.occupation}</p>
                </div>
                <div class="details-section">
                    <h4><i class="fas fa-address-book"></i> Contact Information</h4>
                    <p><strong>Email:</strong> ${record.email}</p>
                    <p><strong>Contact Number:</strong> ${record.contactNumber}</p>
                    <p><strong>Emergency Contact:</strong> ${record.emergencyContact}</p>
                </div>
                <div class="details-section">
                    <h4><i class="fas fa-users"></i> Family Information</h4>
                    <p><strong>Mother's Name:</strong> ${record.motherName}</p>
                    <p><strong>Father's Name:</strong> ${record.fatherName}</p>
                </div>
                <div class="details-section">
                    <h4><i class="fas fa-file-alt"></i> Document Information</h4>
                    <p><strong>Document Type:</strong> ${capitalizeFirstLetter(record.documentType)}</p>
                    <p><strong>Primary ID:</strong> ${record.primaryIdNumber}</p>
                    <p><strong>Secondary ID 1:</strong> ${record.secondaryIdNumber1 || 'Not provided'}</p>
                    <p><strong>Secondary ID 2:</strong> ${record.secondaryIdNumber2 || 'Not provided'}</p>
                    <p><strong>Place of Issue:</strong> ${record.placeOfIssue}</p>
                    <p><strong>Date of Issue:</strong> ${formatDate(record.dateOfIssue)}</p>
                    <p><strong>Expiry Date:</strong> ${formatDate(record.expiryDate)}</p>
                    <p><strong>Issuing Authority:</strong> ${record.issuingAuthority}</p>
                </div>
            </div>
            <div class="action-buttons">
                <button id="approveBtn" class="btn-approve">Approve</button>
                <button id="rejectBtn" class="btn-reject">Reject</button>
                <button class="close-btn"><i class="fas fa-times"></i> Close</button>
            </div>
        </div>
    `;

    // Approve button handler
    modal.querySelector('#approveBtn').addEventListener('click', () => {
        if (record.status === 'Approved') {
            alert('Applicant is already approved.');
            return;
        }
        record.status = 'Approved';
        record.nationalIdNumber = generateNationalId();
        renderTable();
        alert(`Applicant approved. National ID: ${record.nationalIdNumber}`);
        closeModal(modal);
    });

    // Reject button handler
    modal.querySelector('#rejectBtn').addEventListener('click', () => {
        if (record.status === 'Rejected') {
            alert('Applicant is already rejected.');
            return;
        }
        record.status = 'Rejected';
        record.nationalIdNumber = 'None';
        renderTable();
        alert('Applicant rejected.');
        closeModal(modal);
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });

    // Close button handler
    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => closeModal(modal));

    // Escape key handler
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal(modal);
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
    
    document.body.appendChild(modal);
}

// Generate National ID with format PH-RANDOM5DIGITS-LASTTWODIGITSOFYEAR+MONTH
function generateNationalId() {
    const prefix = 'PH-';
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${prefix}${randomDigits}-${year}${month}`;
}

function closeModal(modal) {
    modal.classList.add('modal-closing');
    setTimeout(() => {
        document.body.removeChild(modal);
    }, 300);
}

function handleFormSubmit() {
    const data = gatherFormData();
    data.nationalIdNumber = 'To be issued';
    data.status = 'Pending';
    
    if (editIndex === -1) {
        records.push(data);
    } else {
        records[editIndex] = data;
        editIndex = -1;
    }

    resetForm();
    renderTable();
    showMessage('Record saved successfully!', 'success');
}

function gatherFormData() {
    const fields = [
        'fullName', 'dob', 'gender', 'birthAddress', 'currentAddress',
        'motherName', 'fatherName', 'contactNumber', 'primaryIdNumber',
        'secondaryIdNumber1', 'secondaryIdNumber2', 'nationality',
        'maritalStatus', 'occupation', 'email', 'emergencyContact',
        'placeOfIssue', 'dateOfIssue', 'expiryDate', 'issuingAuthority',
        'documentType'
    ];

    return fields.reduce((obj, field) => {
        obj[field] = document.getElementById(field).value.trim();
        return obj;
    }, {});
}

function resetForm() {
    const form = document.getElementById('registrationForm');
    form.reset();
    editIndex = -1;
    document.getElementById('submitBtn').textContent = 'Add Record';
    document.getElementById('cancelBtn').style.display = 'none';
    document.getElementById('errorMessage').textContent = '';
    showStep(1);
}

function showMessage(message, type = 'error') {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.style.color = type === 'error' ? 'var(--danger-color)' : 'var(--success-color)';
    setTimeout(() => {
        errorMessage.textContent = '';
    }, 3000);
}

function formatDate(dateString) {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Function to show form step
window.showStep = function(step) {
    document.querySelectorAll('.form-step').forEach(el => {
        el.classList.remove('form-step-active');
    });
    const nextStep = document.querySelector(`.form-step[data-step="${step}"]`);
    if (!nextStep) return;
    
    nextStep.classList.add('form-step-active');
    currentStep = step;
    
    // Update review info when showing the review step
    if (step === totalSteps) {
        const data = gatherFormData();
        const reviewInfo = document.getElementById('reviewInfo');
        if (reviewInfo) {
            reviewInfo.innerHTML = `
                <div class="review-section">
                    <h4><i class="fas fa-user"></i> Personal Information</h4>
                    <p><strong>Full Name:</strong> ${data.fullName}</p>
                    <p><strong>Date of Birth:</strong> ${formatDate(data.dob)}</p>
                    <p><strong>Gender:</strong> ${capitalizeFirstLetter(data.gender)}</p>
                    <p><strong>Birth Place:</strong> ${data.birthAddress}</p>
                    <p><strong>Current Address:</strong> ${data.currentAddress}</p>
                </div>
                <div class="review-section">
                    <h4><i class="fas fa-users"></i> Family Information</h4>
                    <p><strong>Mother's Name:</strong> ${data.motherName}</p>
                    <p><strong>Father's Name:</strong> ${data.fatherName}</p>
                    <p><strong>Contact Number:</strong> ${data.contactNumber}</p>
                </div>
                <div class="review-section">
                    <h4><i class="fas fa-file-alt"></i> Document Information</h4>
                    <p><strong>Document Type:</strong> ${capitalizeFirstLetter(data.documentType)}</p>
                    <p><strong>Primary ID:</strong> ${data.primaryIdNumber}</p>
                    <p><strong>Secondary ID 1:</strong> ${data.secondaryIdNumber1 || 'Not provided'}</p>
                    <p><strong>Secondary ID 2:</strong> ${data.secondaryIdNumber2 || 'Not provided'}</p>
                    <p><strong>Place of Issue:</strong> ${data.placeOfIssue}</p>
                    <p><strong>Date of Issue:</strong> ${formatDate(data.dateOfIssue)}</p>
                    <p><strong>Expiry Date:</strong> ${formatDate(data.expiryDate)}</p>
                    <p><strong>Issuing Authority:</strong> ${data.issuingAuthority}</p>
                </div>
            `;
        }
    }
}
