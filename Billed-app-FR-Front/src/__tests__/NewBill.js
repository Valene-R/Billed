/**
 * @jest-environment jsdom
 */

import { screen } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"


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
  })
})