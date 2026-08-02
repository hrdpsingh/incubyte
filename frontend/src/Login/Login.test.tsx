import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, test, expect } from "vitest";

import Login from "./Login";

test("logs in successfully", async () => {
    // Standardize user event engine before rendering component
    const user = userEvent.setup();

    // Mock successful authentication API response
    vi.stubGlobal(
        "fetch",
        vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () =>
                    Promise.resolve({
                        access_token: "token123",
                    }),
            })
        )
    );

    // Spy on navigation and state setter callbacks passed as props
    const setToken = vi.fn();
    const navigate = vi.fn();
    const setIsAdmin = vi.fn();

    render(
        <Login
            setToken={setToken}
            navigate={navigate}
            setIsAdmin={setIsAdmin}
        />
    );

    // Simulate complete user authentication flow
    await user.type(
        screen.getByPlaceholderText(
            "Username"
        ),
        "admin"
    );

    await user.type(
        screen.getByPlaceholderText(
            "Password"
        ),
        "password"
    );

    await user.click(
        screen.getByRole("button", {
            name: /sign in/i,
        })
    );

    // Verify network request was dispatched and authentication state was persisted
    expect(fetch).toHaveBeenCalled();

    expect(setToken).toHaveBeenCalledWith(
        "token123"
    );
});