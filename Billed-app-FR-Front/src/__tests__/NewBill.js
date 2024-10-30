/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom"
import mockStore from "../__mocks__/store.js"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import { ROUTES_PATH } from "../constants/routes.js"
import router from "../app/Router"

// Mock the store (API)
jest.mock('../app/store', () => mockStore)


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    // Test if the NewBill form is displayed
    test("Then the NewBill form should be displayed", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      const form = screen.getByTestId("form-new-bill")
      expect(form).toBeTruthy()
    })

    // Test if the file input field exists in the form
    test("Then the file input should be in the form", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      const fileInput = screen.getByTestId("file")
      expect(fileInput).toBeTruthy()
    })

    // Test if a valid file (jpg, jpeg, png) can be uploaded
    test("Then I can upload a valid file (jpg, jpeg, png)", async () => {
      // Initialize a new instance of NewBill
      const newBill = new NewBill({ 
        document, onNavigate: jest.fn(), store: null, localStorage: window.localStorage 
      })

      // Select the file input field in the NewBill form
      const fileInput = screen.getByTestId("file")

      // Create a mock file with valid type (jpg)
      const file = new File(["valid image"], "image.jpg", { type: "image/jpg" })

      // Mock the handleChangeFile method of newBill instance
      const handleChangeFile = jest.fn(newBill.handleChangeFile)
      fileInput.addEventListener("change", handleChangeFile)

      // Trigger the change event with the mock file to simulate file upload
      fireEvent.change(fileInput, { target: { files: [file] } })

      // Verify that handleChangeFile has been called
      expect(handleChangeFile).toHaveBeenCalled()

      // Wait for the file name in the input to match the uploaded file's name
      await waitFor(() => expect(fileInput.files[0].name).toBe("image.jpg"))
    })

    // Test if an error message is displayed when an invalid file type is uploaded
    test("Then an error message should be displayed if the file has an invalid extension", async () => {
      const newBill = new NewBill({ 
        document, onNavigate: jest.fn(), store: null, localStorage: window.localStorage 
      })
      const fileInput = screen.getByTestId("file")

      // Create a mock file with an invalid type (pdf)
      const file = new File(["dummy content"], "test.pdf", { type: "application/pdf" })

      const handleChangeFile = jest.fn(newBill.handleChangeFile)
      fileInput.addEventListener("change", handleChangeFile)

      fireEvent.change(fileInput, { target: { files: [file] } })

      expect(handleChangeFile).toHaveBeenCalled()
      
      // Wait for the error message to be displayed for invalid file type
      await waitFor(() => expect(screen.getByText("Seuls les fichiers de type jpg, jpeg, ou png sont acceptés.")).toBeTruthy())

      // Verify if the file input is reset (no file retained) after an invalid file is uploaded
      expect(fileInput.value).toBe("") 
    })
  })

  describe("When I am on NewBill Page and I submit the form", () => {
    // Test if form submission is triggered
    test("Then the form submission should be triggered", () => {
      // Mock localStorage and set the user details
      Object.defineProperty(window, "localStorage", { value: localStorageMock })
      window.localStorage.setItem("user", JSON.stringify({ 
        type: 'Employee',
        email: 'a@a' 
      }))

      // Render the NewBill form interface
      const html = NewBillUI()
      document.body.innerHTML = html

      // Initialize NewBill instance with necessary arguments
      const onNavigate = jest.fn()
      const newBill = new NewBill({ 
        document, onNavigate, store: mockStore, localStorage: window.localStorage 
      })

      // Select the form element and mock the handleSubmit method
      const form = screen.getByTestId("form-new-bill")
      const handleSubmit = jest.fn(newBill.handleSubmit)
      form.addEventListener("submit", handleSubmit)

      // Simulate form submission
      fireEvent.submit(form)

      // Verify if handleSubmit was called upon form submission
      expect(handleSubmit).toHaveBeenCalled()
    })
  })
})