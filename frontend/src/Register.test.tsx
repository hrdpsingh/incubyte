import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, test, expect } from "vitest";
import Register from "./Register";

test("registers a new user", async () => {
    const user = userEvent.setup();

    const mockOnRegistered = vi.fn();

    vi.stubGlobal(
        "fetch",
        vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () =>
                    Promise.resolve({
                        message: "User created",
                    }),
            }),
        ),
    );

    render(<Register onRegistered={mockOnRegistered} />);

    await user.type(
        screen.getByPlaceholderText("Username"),
        "alice"
    );

    await user.type(
        screen.getByPlaceholderText("Password"),
        "Password123!"
    );

    await user.click(
        screen.getByRole("button", {
            name: /register/i,
        })
    );

    expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/auth/register"),
        expect.objectContaining({
            method: "POST",
        })
    );

    expect(mockOnRegistered).toHaveBeenCalled();
});