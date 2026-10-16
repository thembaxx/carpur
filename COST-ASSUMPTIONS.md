# Ownership estimates: reference model and original app

Phase 4 intentionally uses the supplied `fin`, `run` and `total` functions in `src/lib/data.ts`, as required by the handoff. Their formulas and defaults have not been changed. These are illustrative planning estimates, not sourced current rates, finance offers, insurance quotes or predictions of credit approval.

The original app was checked at the same pinned source commit as the catalogue: [`thembaxx/nou2`, `3a1c777242f6536cf4b53de6a259d70d2bb5fc8b`](https://github.com/thembaxx/nou2/tree/3a1c777242f6536cf4b53de6a259d70d2bb5fc8b). Relevant sources are `app/sources/page.tsx`, `lib/finance.ts`, `lib/vehicle-options.ts` and `components/finance-tool.tsx`.

| Assumption or output | Supplied redesign reference | Original app |
| --- | --- | --- |
| Deposit | 10% of reference price | 10% initially; editable rand amount |
| Annual nominal interest | 12.5% initially | 12% initially |
| Term | 60 months initially; 12–72 month slider | 72 months initially; 12–96 month options |
| Distance | 1 500 km/month initially | 15 000 km/year initially, or 1 250 km/month |
| Petrol price | R24/L initially | R24/L initially |
| Diesel price | Uses the illustrative petrol input | R23/L initially |
| Consumption | Fixed illustrative 6.5 L/100 km | Manufacturer consumption where available; editable 7 L/100 km fallback |
| Plug-in hybrid energy | Same petrol model; no charging allowance | Illustrative 7 L/100 km plus editable R450/month charging allowance |
| Insurance | 5% of price per year | Editable R1 500/month initially |
| Maintenance | 1.5% of price per year | Editable R900/month initially |
| Finance calculation | Standard annuity, no balloon | Annuity with optional balloon |
| 1/3/5-year totals | Deposit + instalments capped at term + running costs | Separately reports cash outflow, remaining debt, resale and net ownership cost |
| Resale, remaining debt | Excluded from displayed totals | Remaining principal plus declining-balance resale; 12% annual depreciation initially |
| Budget headroom | Not calculated by the five-slider reference | Net income minus living costs/commitments and monthly vehicle outflow |
| Fees, inflation and live rates | Not modelled | Not automatic; defaults are also planning assumptions |

The original Sources page explicitly says its financial defaults are planning assumptions, not live feeds. Checking that page does not validate the redesign's 12.5%, 6.5 L/100 km, 5% or 1.5% as real-world quotations. None has been promoted to a sourced fact.

## Meaning of Phase 4 results

- Finance uses the manufacturer reference price, deposit percentage, fixed annual nominal rate divided by 12 and selected loan term. Instalments stop when the term ends.
- Fuel uses monthly distance × 6.5 / 100 × the petrol price input. Insurance and maintenance use their annual percentages of reference price divided by 12.
- The totals are estimated cash paid over each horizon. They exclude outstanding loan principal, resale value, charging, fees, taxes not already included in reference price, inflation and changes in rates or vehicle condition. They are not the original app's net ownership-cost measure.
- Catalogue fuel/body/transmission metadata remains sourced. For any diesel, hybrid or plug-in hybrid selection, the UI explicitly warns that its energy estimate uses the illustrative petrol model and needs a separate energy budget.
- The calculator's existing assumption footnote remains visible. Vehicle and comparison outputs retain their estimate labels and disclaimer. Financial slider values stay in the current page and are not submitted to a server.

For Starlet at the reference defaults, the rounded estimated monthly amount is **R9 364**, with 1/3/5-year totals of **R139 744 / R364 491 / R589 238**. Browser checks compare actual results with the unmodified artifact's functions for all 44 catalogue prices, slider endpoints, fractional inputs and terms shorter than the ownership horizon.

## Decision before launch

The reference's five-slider experience and the original app's fuller financial model are different products. Before production launch, choose whether to retain this explicitly illustrative model or restore vehicle-specific energy, editable insurance/maintenance, fees, balloon/resale/debt and budget-headroom inputs. That change would need updated product copy, controls, source documentation and acceptance expectations. Phase 4 preserves the requested reference behavior rather than silently replacing its calculations.
