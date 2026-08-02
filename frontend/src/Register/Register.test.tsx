import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, test, expect } from "vitest";

import Register from "./Register";

test("registers a user", async () => {
    // Initialize userEvent session prior to component rendering to correctly track focus and synthetic events
    const user = userEvent.setup();

    // Mock network boundary to simulate a successful 201 response without hitting a backend
    vi.stubGlobal(
        "fetch",
        vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () =>
                    Promise.resolve({
                        message: "created",
                    }),
            })
        )
    );

    // Spy on routing callback to verify post-submission redirection
    const navigate = vi.fn();

    render(
        <Register navigate={navigate} />
    );

    // Simulate complete user registration flow through accessible UI controls
    await user.type(
        screen.getByPlaceholderText(
            "Username"
        ),
        "alice"
    );

    await user.type(
        screen.getByPlaceholderText(
            "Password"
        ),
        "password123"
    );

    await user.click(
        screen.getByRole("button", {
            name: /register/i,
        })
    );

    // Assert side-effects: API dispatch and successful route transition
    expect(fetch).toHaveBeenCalled();

    expect(navigate).toHaveBeenCalledWith(
        "login"
    );
});