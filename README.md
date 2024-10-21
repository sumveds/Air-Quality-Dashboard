

# use the other workshop directory to document and refer to it from here. Also refer to it from there.

# Decide on values to show/present
# Find the right data source
# Decide on visualization analysis to present
- use black theme for map.
# Documentation
# Document how to setup already developed code - Share already developed code with participants using scan code and then walk them through it.

# pre-requisite - they need to install node js
# then install vite and pnpm
# Use VSCode for development for autocomplete and tailwind support
# Vercel account to deploy
# GitHub account to push code.

# create a new project

# Step 1
##pnpm create vite . --template react-ts

# Step 2

Install dependencies

pnpm install

# Step 3

Start the dev server

pnpm dev

# Step 4 - Clean up the codebase

# Step 5 - Setup tailwind

https://tailwindcss.com/

pnpm add -D tailwindcss postcss autoprefixer

# create init file

npx tailwindcss init -p

# edit file to include files tailwind should check
# specify only the files we need. i.e tsx files.

#add tailwind directives to index.css

@tailwind base;
@tailwind components;
@tailwind utilities;


# API call use axios

https://axios-http.com/docs/intro

pnpm add axios


# Install maplibre gl