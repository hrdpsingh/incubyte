export default function ErrorAlert({ message }: { message: string }) {
    return (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 shadow-sm">
            {message}
        </div>
    );
}