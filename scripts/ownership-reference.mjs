// Align only catalogue content and the disclosed energy-model note in the reference runtime.
// All reference rendering, cost functions, CSS and the HTML file remain unchanged.
import { referenceCars } from "./catalogue-reference.mjs";

export const energyNote = "Energy costs use an illustrative petrol model, not this vehicle’s actual energy use. Diesel, hybrid and charging costs need separate estimates.";
export const adjustedInputs = { dep: 25, n: 36, rate: 14.5, km: 2400, fp: 26 };

export async function alignOwnershipReference(page, adjusted = false) {
  await page.evaluate(({ cars, note, inputs }) => {
    window.eval("CARS").splice(0, window.eval("CARS").length, ...cars);
    const route = location.hash.slice(2).split("?");
    const query = new URLSearchParams(route[1] || "");
    let nonPetrol = false, parent;
    if (route[0] === "compare") {
      const find = window.eval("car");
      const a = find(query.get("a")) || find("catalogue-toyota-1616");
      const b = find(query.get("b")) || find("catalogue-toyota-1919");
      query.set("a", a.id); query.set("b", b.id);
      const view = window.eval("cmp")(query);
      document.querySelector("main").innerHTML = view[0];
      view[1]?.();
      const cells = document.querySelector("table tr:last-child").children;
      cells[1].textContent = a.bodyStyle; cells[2].textContent = b.bodyStyle;
      nonPetrol = a.f !== "Petrol" || b.f !== "Petrol";
      parent = document.querySelector("main .sec");
    } else {
      window.eval("go")();
      if (route[0] === "afford") {
        if (inputs) {
          for (const [key, value] of Object.entries(inputs)) document.getElementById(key).value = value;
          document.getElementById("af").dispatchEvent(new Event("input", { bubbles: true }));
        }
        const selected = cars.find((car) => car.id === query.get("id")) || cars[0];
        nonPetrol = selected.f !== "Petrol";
        parent = document.getElementById("res");
      } else if (route[0].startsWith("car/")) {
        const selected = cars.find((car) => car.id === route[0].slice(4));
        nonPetrol = !!selected && selected.f !== "Petrol";
        parent = document.querySelector("main .hero > div:last-child");
      }
    }
    if (nonPetrol && parent) {
      const paragraph = document.createElement("p");
      paragraph.className = "mut";
      paragraph.style.cssText = "font-size:12px;margin-top:10px";
      paragraph.textContent = note;
      parent.append(paragraph);
    }
  }, { cars: referenceCars, note: energyNote, inputs: adjusted ? adjustedInputs : null });
}

export async function setRange(page, key, value) {
  await page.locator(`#${key}`).evaluate((element, value) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(element, String(value));
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
  await page.waitForFunction(({ key, value }) => document.getElementById(`o${key}`).textContent === String(value), { key, value }, { polling: 50 });
}
