import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, test, expect } from "vitest";

import Login from "./Login";

test("logs in successfully", async () => {
    const user = userEvent.setup();

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
            name: /login/i,
        })
    );

    expect(fetch).toHaveBeenCalled();

    expect(setToken).toHaveBeenCalledWith(
        "token123"
    );
});