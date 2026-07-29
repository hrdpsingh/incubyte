import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, test, expect } from "vitest";
import Login from "./Login";

test("logs in successfully", async () => {
    const user = userEvent.setup();

    const mockSetToken = vi.fn();

    vi.stubGlobal(
        "fetch",
        vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () =>
                    Promise.resolve({
                        access_token: "fake-token",
                    }),
            }),
        ),
    );

    render(<Login setToken={mockSetToken} />);

    await user.type(
        screen.getByPlaceholderText("Username"),
        "admin",
    );

    await user.type(
        screen.getByPlaceholderText("Password"),
        "password",
    );

    await user.click(
        screen.getByRole("button", { name: /login/i }),
    );

    expect(fetch).toHaveBeenCalled();

    expect(mockSetToken).toHaveBeenCalledWith("fake-token");
});