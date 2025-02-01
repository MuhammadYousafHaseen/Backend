# Backend Learning by Yousaf Haseen

## Project Overview

This project serves as a backend for a web application that enables users to create and manage personal blogs. It is built using **Node.js** and **Express.js**, with **MongoDB** as the database. The application offers features such as user authentication, blog creation, commenting, tagging, categorization, and search functionality.

## Features

- **User Authentication and Authorization**: Secure login and registration for users.
- **Blog Management**: Create, edit, and delete personal blog posts.
- **Commenting**: Users can comment on blog posts.
- **Tagging and Categorization**: Organize blogs using tags and categories.
- **Search Functionality**: Search for blogs based on keywords.

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/MuhammadYousafHaseen/Backend.git
   cd Backend
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**:
   - Create a `.env` file in the root directory.
   - Add the following variables:
     ```
     PORT=5000
     MONGODB_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret
     ```

4. **Start the Server**:
   ```bash
   npm start
   ```

## Usage Guide

After setting up and starting the server:

- **Access the Application**: Navigate to `http://localhost:5000` in your browser.
- **API Endpoints**: Use tools like Postman to interact with the API endpoints listed below.

## API Endpoints

### User Authentication

- **Register a New User**
  - **Endpoint**: `/api/users/register`
  - **Method**: `POST`
  - **Description**: Registers a new user.
  - **Request Body**:
    ```json
    {
      "username": "exampleUser",
      "email": "user@example.com",
      "password": "password123"
    }
    ```

- **User Login**
  - **Endpoint**: `/api/users/login`
  - **Method**: `POST`
  - **Description**: Authenticates a user and returns a token.
  - **Request Body**:
    ```json
    {
      "email": "user@example.com",
      "password": "password123"
    }
    ```

### Blog Management

- **Create a New Blog Post**
  - **Endpoint**: `/api/blogs`
  - **Method**: `POST`
  - **Description**: Creates a new blog post.
  - **Request Body**:
    ```json
    {
      "title": "My First Blog",
      "content": "This is the content of my first blog.",
      "tags": ["Introduction", "FirstPost"]
    }
    ```

- **Get All Blog Posts**
  - **Endpoint**: `/api/blogs`
  - **Method**: `GET`
  - **Description**: Retrieves all blog posts.

- **Get a Single Blog Post**
  - **Endpoint**: `/api/blogs/:id`
  - **Method**: `GET`
  - **Description**: Retrieves a single blog post by ID.

- **Update a Blog Post**
  - **Endpoint**: `/api/blogs/:id`
  - **Method**: `PUT`
  - **Description**: Updates a blog post by ID.
  - **Request Body**:
    ```json
    {
      "title": "Updated Blog Title",
      "content": "Updated content.",
      "tags": ["UpdatedTag"]
    }
    ```

- **Delete a Blog Post**
  - **Endpoint**: `/api/blogs/:id`
  - **Method**: `DELETE`
  - **Description**: Deletes a blog post by ID.

### Commenting

- **Add a Comment to a Blog Post**
  - **Endpoint**: `/api/blogs/:id/comments`
  - **Method**: `POST`
  - **Description**: Adds a comment to a specific blog post.
  - **Request Body**:
    ```json
    {
      "comment": "This is a comment."
    }
    ```

- **Get Comments for a Blog Post**
  - **Endpoint**: `/api/blogs/:id/comments`
  - **Method**: `GET`
  - **Description**: Retrieves all comments for a specific blog post.

## Author

[Muhammad Yousaf Haseen](https://github.com/MuhammadYousafHaseen)

## Mentor

[Hitesh Choudhary](https://github.com/hiteshchoudhary)
