/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import userEvent from "@testing-library/user-event"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import mockStore from "../__mocks__/store" 
import { ROUTES_PATH } from "../constants/routes.js"
import {localStorageMock} from "../__mocks__/localStorage.js"
import router from "../app/Router.js"
import Bills from "../containers/Bills"

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')

      // Verify that the icon is present and highlighted
      expect(windowIcon).toBeTruthy()
      expect(windowIcon.classList.contains('active-icon')).toBe(true)
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })

  describe("When I am on Bills Page and I click on NewBill button", () => {
    // Test if clicking the 'New Bill' button navigates to the NewBill page
    test("Then it should navigate to the NewBill page", async () => {
      const onNavigate = jest.fn()  // Mock the navigation function
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)

      router(); // Initialize the router
      window.onNavigate(ROUTES_PATH.Bills) // Simulate navigating to the Bills page
      
      // Create an instance of Bills
      const billsInstance = new Bills({ document, onNavigate, store: null, localStorage: window.localStorage })

      // Wait for the 'New Bill' button to appear in the DOM
      await waitFor(() => screen.getByTestId('btn-new-bill'))
      const buttonNewBill = screen.getByTestId('btn-new-bill')
      
      // Verify the 'New Bill' button is present
      expect(buttonNewBill).toBeTruthy() 
      
      // Simulate clicking the 'New Bill' button
      const handleClickNewBill = jest.fn(billsInstance.handleClickNewBill)  
      buttonNewBill.addEventListener('click', handleClickNewBill) 
      userEvent.click(buttonNewBill)  

      // Verify the click event and navigation
      expect(handleClickNewBill).toHaveBeenCalled();  
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['NewBill'])  
    })
  })

  describe("When I am on Bills Page and I click on the IconEye of a bill", () => {
    // Test if clicking on the 'Eye' icon open the modal and display the bill file
    test("Then the modal should open and display the bill file", async () => {
      // Mock jQuery modal function
      $.fn.modal = jest.fn()

      // Simulate localStorage for user type 'Employee'
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee' 
      }))

      // Create the root element and router
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()

      // Load the Bills UI with mock data
      document.body.innerHTML = BillsUI({ data: bills })
      window.onNavigate(ROUTES_PATH.Bills)

      // Create an instance of Bills
      const billsInstance = new Bills({ document, onNavigate, store: null, localStorage: window.localStorage })

      // Verify each 'Eye' icon has a click event attached
      const iconEyeElements = screen.getAllByTestId('icon-eye')
      expect(iconEyeElements.length).toBeGreaterThan(0)  // Ensure there is at least one 'Eye' icon

      // Add a check to ensure that each icon has a click event
      iconEyeElements.forEach(icon => {
        const handleClickIconEye = jest.fn(() => billsInstance.handleClickIconEye(icon))
        icon.addEventListener('click', handleClickIconEye)
        userEvent.click(icon) 

        // Verify that the function is called on click
        expect(handleClickIconEye).toHaveBeenCalled()
      })

      // Simulate adding a modal to the DOM
      document.body.innerHTML += `
        <div class="modal" id="modaleFile" data-testid="modaleFile">
          <div class="modal-body"></div>
        </div>
      `

      // Simulate clicking on the first 'Eye' icon
      const firstIconEye = iconEyeElements[0]
      const handleClickIconEye = jest.fn(() => billsInstance.handleClickIconEye(firstIconEye))
      firstIconEye.addEventListener('click', handleClickIconEye)
      userEvent.click(firstIconEye)

      // Verify that the handleClickIconEye function was called for the first icon
      expect(handleClickIconEye).toHaveBeenCalled()

      // Wait for the modal to be present in the DOM
      const modal = await waitFor(() => screen.getByTestId('modaleFile'))

      // Verify that the modal is displayed
      expect(modal).toBeTruthy()

      // Verify that the bill file is displayed with the correct URL
      const modalFile = screen.getByAltText('Bill')
      expect(modalFile).toBeTruthy()
      expect(modalFile.getAttribute('src')).toBe('https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a')

      // Verify that jQuery's modal method has been called
      expect($.fn.modal).toHaveBeenCalledWith('show')
    })
  })
})


// GET Integration Test
describe("Given I am connected as an employee", () => {
  describe("When I am on Bills page and I call getBills", () => {
    // Test if bills fetched from the mock API are sorted correctly
    test("Then it should fetch the bills from mock API and display them sorted by date", async () => {
      // Mock API
      const billsInstance = new Bills({ document, onNavigate, store: mockStore, localStorage: window.localStorage })
      const bills = await billsInstance.getBills()

      expect(bills.length).toBe(4) // Ensure that 4 bills are returned
      expect(bills[0].date).toBeDefined() // Check if the date is defined
      expect(bills[0].status).toBeDefined() // Check if the status is defined
      
      // Verify that the bills are sorted in descending order of date
      for (let i = 0; i < bills.length - 1; i++) {
        const date1 = new Date(bills[i].date).getTime()
        const date2 = new Date(bills[i + 1].date).getTime()
      
        if (!isNaN(date1) && !isNaN(date2)) {  // Ensure both dates are valid before comparing
          expect(date1).toBeGreaterThan(date2)
        }
      }
    })
  })

  describe("When I am on Bills page and there is invalid data", () => {
    // Test if invalid data is logged and handled
    test("Then it should log an error and return the unformatted date", async () => {
      const invalidBills = [{
        id: "47qAXb6fIm2zOKkLzMro",
        date: "invalid-date", // Simulate a bill with an invalid date format to trigger an error
        status: "pending"
      }]
      
      // Mock the API to return invalid Bills
      const mockStoreWithError = {
        bills() {
          return {
            list: () => Promise.resolve(invalidBills)
          }
        }
      }

      // Spy console.log to verify that it is called with an error
      const logSpy = jest.spyOn(console, 'log')
      
      // Create an instance of Bills with the mocked store
      const billsInstance = new Bills({ document, onNavigate, store: mockStoreWithError, localStorage: window.localStorage })
      const bills = await billsInstance.getBills()

      // Ensure one invalid bill is returned
      expect(bills.length).toBe(1)

      // Verify that the error is logged for the invalid date
      expect(logSpy).toHaveBeenCalledWith(expect.any(Error), 'for', expect.any(Object))

      // Restore the original behavior of console.log
      logSpy.mockRestore()
    })
  })

  // Test to check error handling for API fails (404 and 500)
  describe("When I navigate to Bills page and an error occurs on API", () => {
    // Set up mock store and localStorage before each test
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "a@a"
      }))
      document.body.innerHTML = `<div id="root"></div>`
      router()
    })

    // Test if API returns a 404 error and the correct message is displayed
    test("fetches bills from an API and fails with 404 message error", async () => {
      // Mock API to return a 404 error
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => Promise.reject(new Error("Erreur 404"))
        }
      })

      // Simulate navigating to Bills page
      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick) // Wait for the API to fail

      // Verify if the 404 error message is displayed
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })

    // Test if API returns a 500 error and the correct message is displayed
    test("fetches bills from an API and fails with 500 message error", async () => {
      // Mock API to return a 500 error
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => Promise.reject(new Error("Erreur 500"))
        }
      })
    
      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick)
    
      // Verify if the 500 error message is displayed
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
})
