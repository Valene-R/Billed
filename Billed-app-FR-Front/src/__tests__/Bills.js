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
