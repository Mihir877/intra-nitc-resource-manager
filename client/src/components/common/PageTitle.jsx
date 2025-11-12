import React from "react";

const PageTitle = ({ title, subtitle, children }) => {
  return (
    <header className="flex justify-between items-center px-3 sm:px-5 py-2 sm:py-4 bg-muted rounded-md mb-4">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        {subtitle && (
          <p className="hidden md:block text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      {children}
    </header>
  );
};

export default PageTitle;
