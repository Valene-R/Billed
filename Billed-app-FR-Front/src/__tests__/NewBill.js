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

  describe("When I am on the NewBill Page and I upload a file", () => {
    test("Then it should not store the file if the user cancels the selection", async () => {
      // Render the NewBill form interface and initialize the NewBill instance
      const html = NewBillUI()
      document.body.innerHTML = html
      const newBill = new NewBill({ 
        document, onNavigate: jest.fn(), store: null, localStorage: window.localStorage 
      })

      // Select the file input field
      const fileInput = screen.getByTestId("file")

      // Simulate file selection cancellation by setting an empty file
      Object.defineProperty(fileInput, 'files', {
        value: [] // No file selected
      })

      // Trigger the change event on the file input
      fireEvent.change(fileInput) 

      // Verify that no file information is stored in the NewBill instance
      expect(newBill.file).toBeNull()
      expect(newBill.fileName).toBeNull()
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

      // Mock navigation and initialize NewBill instance with necessary arguments
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

    // Test if the form is not submitted when the file input is empty
    test("Then the form should not submit if the file input is empty", async () => {
      const onNavigate = jest.fn()
      const newBill = new NewBill({ 
        document, onNavigate, store: mockStore, localStorage: window.localStorage 
      })

      // Select form and file input elements
      const form = screen.getByTestId("form-new-bill")
      const fileInput = screen.getByTestId("file")

      // Mock handleSubmit and attach it to form submission event
      const handleSubmit = jest.fn(newBill.handleSubmit)
      form.addEventListener("submit", handleSubmit)

      // Simulate form submission with empty file input
      fireEvent.submit(form)

      // Verify handleSubmit was called upon form submission
      expect(handleSubmit).toHaveBeenCalled()
      // Verify that file input remains empty (no file was submitted)
      expect(fileInput.value).toBe("")
    })
  })

  describe("When I am on NewBill Page and I create a new bill", () => {
    // Test if the file is uploaded and the bill is created
    test("Then the file should be uploaded and the bill should be created", async () => {
      const onNavigate = jest.fn()

      // Mock the global fetch to simulate file upload response
      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({ fileUrl: "https://localhost:3456/images/test.jpg", key: "1234" })
        })
      )

      // Define a mockStore with a mocked bills to simulate API interactions for creating and updating bill
      const mockStore = {
        bills: () => ({
          create: jest.fn().mockResolvedValue({ fileUrl: "https://localhost:3456/images/test.jpg", key: "1234" }),
          update: jest.fn().mockResolvedValue({})
        }),
      };

      const newBill = new NewBill({ 
        document, onNavigate, store: mockStore, localStorage: window.localStorage 
      })

      // Mock localStorage and set user data
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ 
        type: 'Employee', 
        email: 'a@a' 
      }))

      // Render the NewBill form interface
      document.body.innerHTML = NewBillUI()
      const form = screen.getByTestId("form-new-bill")

      // Attach mocked handleSubmit method to the form's submit event
      const handleSubmit = jest.fn(newBill.handleSubmit)
      form.addEventListener("submit", handleSubmit)

      // Simulate form submission
      fireEvent.submit(form)

      // Verify that handleSubmit was called on form submission
      await waitFor(() => expect(handleSubmit).toHaveBeenCalled())

      // Verify that onNavigate was called with the Bills page route after submission
      await waitFor(() => expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.Bills))
    })

    // Test if an error is logged when there is an issue during bill update
    test("Then it should log an error if there is an issue during bill update", async () => {
      // Mock the update method to simulate a failed API response
      const mockUpdate = jest.fn().mockRejectedValueOnce(new Error('Update failed'))

      // Initialize a NewBill instance with a mocked store where update will fail
      const newBill = new NewBill({ 
        document, 
        onNavigate: jest.fn(), 
        store: { bills: jest.fn().mockReturnValue({ update: mockUpdate }) }, 
        localStorage: window.localStorage 
      })

      // Mock console.error to verify that it logs the expected error message during the test
      console.error = jest.fn()

      // Render the NewBill form interface
      document.body.innerHTML = NewBillUI()

      // Set a mock billId to simulate an existing bill being updated
      newBill.billId = '1234'

      // Define a mock bill object with test data for the update
      const bill = { 
        email: 'test@test.com', 
        type: 'Transports', 
        name: 'Test Bill', 
        amount: 100, 
        date: '2023-10-22', 
        vat: '20', 
        pct: 20, 
        commentary: 'Test commentary'
      }

      // Call updateBill which should trigger the mocked error
      await newBill.updateBill(bill)

      // Verify that console.error was called with the expected error message
      await waitFor(() => expect(console.error).toHaveBeenCalledWith('Error during bill update:', expect.any(Error)))
    })

    // Test if an error message is logged when billId is missing in the API response
    test("Then it should log an error message if the billId is not defined", async () => {
      const onNavigate = jest.fn()

      // Define a mockStore with a bills function where create does not return a billId
      const mockStore = {
        bills: () => ({
          create: jest.fn().mockResolvedValue({ fileUrl: "https://localhost:3456/images/test.jpg" }) // No billId returned
        }),
      };
  
      const newBill = new NewBill({ 
        document, onNavigate, store: mockStore, localStorage: window.localStorage 
      })
      
      // Mock localStorage and set user information
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ 
        type: 'Employee', 
        email: 'a@a' 
      }))
  
      document.body.innerHTML = NewBillUI()
      const form = screen.getByTestId("form-new-bill")
  
      // Attach a mock handleSubmit function to simulate form submission
      const handleSubmit = jest.fn(newBill.handleSubmit)
      form.addEventListener("submit", handleSubmit)
      fireEvent.submit(form)
  
      // Mock console.error to verify if it logs the expected error message
      console.error = jest.fn() 
  
      // Verify if handleSubmit was called after submission
      await waitFor(() => expect(handleSubmit).toHaveBeenCalled())
  
      // Verify that the error was logged when billId is missing
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith("Bill ID is not defined, cannot update the bill.")
      })
    })
  })
})


// POST Integration Test
describe("Given I am a user connected as Employee", () => {
  describe("When I submit a new bill", () => {
    beforeEach(() => {
      // Spy on the store's bills method to simulate API interaction
      jest.spyOn(mockStore, "bills")
      
      // Set up localStorage with mock user data
      Object.defineProperty(window, "localStorage", { value: localStorageMock })
      window.localStorage.setItem("user", JSON.stringify({
        type: "Employee",
        email: "a@a"
      }))

      // Create a root element for the router
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })

    // Test if the new bill is successfully created via mock API POST
    test("creates new bill from mock API POST", async () => {
      const onNavigate = jest.fn()

      // Mock the create method of bills to simulate a successful response
      jest.spyOn(mockStore.bills(), "create").mockResolvedValue({
        fileUrl: "https://localhost:3456/images/test.jpg",
        key: "1234"
      })

      const newBill = new NewBill({ 
        document, onNavigate, store: mockStore, localStorage: window.localStorage 
      })

      // Select the form element and simulate submission
      const form = screen.getByTestId('form-new-bill')
      const handleSubmit = jest.fn(newBill.handleSubmit)
      form.addEventListener("submit", handleSubmit)
      fireEvent.submit(form)

      // Verify that handleSubmit has been called upon form submission
      await waitFor(() => expect(handleSubmit).toHaveBeenCalled())

      // Verify that the create method has been called with the correct data
      expect(mockStore.bills().create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.any(FormData),
        headers: { noContentType: true }
      }))

      // Verify that the navigation to the Bills page has occurred
      await waitFor(() => expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.Bills))
    })

    // Test if a 404 error is correctly handled during bill creation
    test("creates new bill and fails with 404 message error", async () => {
      // Mock the create method to simulate a 404 error
      mockStore.bills.mockImplementationOnce(() => ({
        create: jest.fn().mockRejectedValue(new Error("Erreur 404"))
      }))

      const onNavigate = jest.fn()
      const newBill = new NewBill({ 
        document, onNavigate, store: mockStore, localStorage: window.localStorage 
      })

      const form = screen.getByTestId('form-new-bill')
      const handleSubmit = jest.fn(newBill.handleSubmit)
      form.addEventListener("submit", handleSubmit)
      fireEvent.submit(form)

      // Spy on console.error to verify if it logs the expected error message
      const consoleErrorSpy = jest.spyOn(console, 'error')

      await waitFor(() => expect(handleSubmit).toHaveBeenCalled())

      // Verify that the 404 error has been logged
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error during bill creation or file upload:', expect.any(Error))
      })

      // Clean up the spy
      consoleErrorSpy.mockRestore()
    })

    // Test if a 500 error is correctly handled from the API during bill creation
    test("creates new bill and fails with 500 message error", async () => {
      // Mock the create method to simulate a 500 error
      mockStore.bills.mockImplementationOnce(() => ({
        create: jest.fn().mockRejectedValue(new Error("Erreur 500"))
      }))

      const onNavigate = jest.fn()
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })

      const form = screen.getByTestId('form-new-bill')
      const handleSubmit = jest.fn(newBill.handleSubmit)
      form.addEventListener("submit", handleSubmit)
      fireEvent.submit(form)

      // Spy on console.error to verify if it logs the expected error message
      const consoleErrorSpy = jest.spyOn(console, 'error')

      await waitFor(() => expect(handleSubmit).toHaveBeenCalled())

      // Verify that the 500 error has been logged
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error during bill creation or file upload:', expect.any(Error))
      })

      // Clean up the spy
      consoleErrorSpy.mockRestore()
    })
  })
})