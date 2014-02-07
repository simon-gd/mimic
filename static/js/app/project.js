define([], function() {
        //return an object to define the "project" module.
        function something(){
            alert("Project Somthing")
        }
        
        return {
            color: "blue",
            size: "large",
            initialize: function() {
                something();
            }
        }
    }
);