import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, test, expect } from "vitest";

import Register from "./Register";

test("registers a user", async () => {
    const user = userEvent.setup();

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

    const navigate = vi.fn();

    render(
        <Register navigate={navigate} />
    );

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

    expect(fetch).toHaveBeenCalled();

    expect(navigate).toHaveBeenCalledWith(
        "login"
    );
});