const mockTransactions = [
    {
        id: 1,
        date: '2023-01-15',
        description: 'Grocery Store',
        amount: -50.25,
        category: 'Food',
    },
    {
        id: 2,
        date: '2023-01-20',
        description: 'Salary',
        amount: 2000.00,
        category: 'Income',
    },
    {
        id: 3,
        date: '2023-01-25',
        description: 'Electricity Bill',
        amount: -75.00,
        category: 'Utilities',
    },
    {
        id: 4,
        date: '2023-02-01',
        description: 'Gym Membership',
        amount: -30.00,
        category: 'Health',
    },
    {
        id: 5,
        date: '2023-02-10',
        description: 'Freelance Project',
        amount: 500.00,
        category: 'Income',
    },
];

const userInfo = {
    name: 'Akbar',
    email: 'akbar@example.com',
    accountBalance: 1874.75,
};

export { mockTransactions, userInfo };
