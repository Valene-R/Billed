import { ROUTES_PATH } from '../constants/routes.js'
import Logout from "./Logout.js"

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store
    const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`)
    formNewBill.addEventListener("submit", this.handleSubmit)
    const file = this.document.querySelector(`input[data-testid="file"]`)
    file.addEventListener("change", this.handleChangeFile)
    this.file = null // Temporarily store the selected file
    this.fileUrl = null
    this.fileName = null
    this.billId = null
    new Logout({ document, localStorage, onNavigate })

    // Add an error message for the date field
    const datepicker = this.document.querySelector(`input[data-testid="datepicker"]`)
    const dateError = document.createElement('p')
    dateError.className = 'error-message'
    dateError.style.display = 'none' // Initially hide the error message
    datepicker.parentNode.appendChild(dateError)

    // Add an event listener to the date field to validate the selected date
    datepicker.addEventListener("change", (e) => {
      const selectedDate = new Date(e.target.value)
      const currentDate = new Date()

      // Check if the selected date is in the future
      if (selectedDate > currentDate) {
        dateError.textContent = "Vous ne pouvez pas entrer une date future."
        dateError.style.display = 'block' 
        e.target.value = "" // Reset the date field
      } else {
        dateError.style.display = 'none' 
      }
    })
  }

  handleChangeFile = e => {
    e.preventDefault()
    const file = this.document.querySelector(`input[data-testid="file"]`).files[0]
    const filePath = e.target.value.split(/\\/g)
    const fileName = filePath[filePath.length-1]

    const allowedExtensions = ['jpg', 'jpeg', 'png']
    const fileExtension = fileName.split('.').pop().toLowerCase()

    // Check if the user canceled the file selection
    if (!file) {
      return
    }

    // Remove the existing error message before checking the validity of the file
    const currentErrorMessage = this.document.querySelector('.error-message')
    if (currentErrorMessage) {
      currentErrorMessage.remove()
    }

    // Check if the file has a valid extension (jpg, jpeg, png)
    // If the file is not valid, display an error message and reset the input
    if (!allowedExtensions.includes(fileExtension)) {
      // Create the error message
      const errorMessage = document.createElement('p')
      errorMessage.className = 'error-message'
      errorMessage.textContent = 'Seuls les fichiers de type jpg, jpeg, ou png sont acceptés.'

      // Add the error message after the file input field
      e.target.parentNode.appendChild(errorMessage)
      e.target.value = '' // Reset the input file to prevent sending the invalid file
      return
    }

    // Temporarily store the selected file information
    this.file = file
    this.fileName = fileName
  }

  handleSubmit = e => {
    e.preventDefault()
    console.log('e.target.querySelector(`input[data-testid="datepicker"]`).value', e.target.querySelector(`input[data-testid="datepicker"]`).value)
    const email = JSON.parse(localStorage.getItem("user")).email

    // Create form data and append the file
    const formData = new FormData()
    formData.append('file', this.file) // Use this.file because it stores the selected file when handleChangeFile is triggered
    formData.append('email', email)

    // Upload the file and create the bill only when the form is submitted
    this.store
      .bills()
      .create({
        data: formData,
        headers: {
          noContentType: true
        }
      })
      .then(({ fileUrl, filePath, key }) => {
        // Check if fileUrl is provided by the backend. If it's missing, construct it using filePath
        // This ensures fileUrl is always defined, preventing issue with an 'undefined' fileUrl
        if (!fileUrl && filePath) {
          fileUrl = `${this.store.api.baseUrl}/${filePath}` // Use the baseUrl of the Store instance to complete the fileUrl
        }
      
        console.log(fileUrl) // Now display the complete URL
      
        this.billId = key
        this.fileUrl = fileUrl
        this.fileName = this.fileName

        const bill = {
          email,
          type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
          name:  e.target.querySelector(`input[data-testid="expense-name"]`).value,
          amount: parseInt(e.target.querySelector(`input[data-testid="amount"]`).value),
          date:  e.target.querySelector(`input[data-testid="datepicker"]`).value,
          vat: e.target.querySelector(`input[data-testid="vat"]`).value,
          pct: parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) || 20,
          commentary: e.target.querySelector(`textarea[data-testid="commentary"]`).value,
          fileUrl: this.fileUrl,
          fileName: this.fileName,
          status: 'pending'
        }
    
        // Call updateBill only if billId is defined
        if (this.billId) {
          this.updateBill(bill)
        } else {
          console.error('Bill ID is not defined, cannot update the bill.')
        }
      })

    .catch(error => console.error('Error during bill creation or file upload:', error))
  }

  // not need to cover this function by tests
  updateBill = (bill) => {
    if (this.store) {
      this.store
      .bills()
      .update({data: JSON.stringify(bill), selector: this.billId})
      .then(() => {
        this.onNavigate(ROUTES_PATH['Bills'])
      })
      .catch(error => console.error('Error during bill update:',error))
    }
  }
}