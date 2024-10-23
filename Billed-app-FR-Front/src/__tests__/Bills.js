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

  describe("When I click on NewBill button", () => {
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
    });
  });
});
