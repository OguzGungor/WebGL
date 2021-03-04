var scale = 0.75;
anim_delay = 20;
render_freq = 1;

var theta1 = [];
var theta2 = [];
var theta3 = [];

var start_x = 0;
var start_y = 0;
default_gaps = [0,0,0];
default_theta = [];

var torso = {
    id : 0,
    width :1.5*scale,
    height : 2 * scale,
    depth : 3*scale,
    gap1 : 0,
    gap2 : 0,
    gap3 : 0,
};


const legs = {
    upper:{
        right:{
            back:{
                id : 1, 
                gap1:0,
                gap2:0,
                gap3:0.75*scale
            },
            middle:{
                id : 2,
                gap1:0,
                gap2:0,
                gap3:1.5*scale 
            },
            front:{
                id : 3,
                gap1:0,
                gap2:0,
                gap3:2.25*scale
            }
        },
        left:{
            back:{
                id : 4,
                gap1:-1.5*scale,
                gap2:0,
                gap3:-1*scale
            },
            middle:{
                id : 5,
                
                gap1:-1.5*scale,
                gap2:0,
                gap3:-1.75*scale
            },
            front:{
                id : 6,                
                gap1:-1.5*scale,
                gap2:0,
                gap3:-2.5*scale
            },            
            rotate1:0,
            rotate2:180,
            rotate3:0
        },        
        width  : 0.25*scale,
        height : 3*scale,
        depth  :0.25*scale 
    },
    lower:{
        right:{
            back:{
                id : 7, 
                gap1:0.1*scale,
                gap2:2.75*scale,
                gap3:0
            },
            middle:{
                id : 8,
                gap1:0.1*scale,
                gap2:2.75*scale,
                gap3:0
            },
            front:{
                id : 9,
                gap1:0.1*scale,
                gap2:2.75*scale,
                gap3:0
            }
        },
        left:{
            back:{
                id : 10 ,
                gap1:0.1*scale,
                gap2:2.75*scale,
                gap3:0
            },
            middle:{
                id : 11,
                gap1:0.1*scale,
                gap2:2.75*scale,
                gap3:0
            },
            front:{
                id : 12,
                gap1:0.1*scale,
                gap2:2.75*scale,
                gap3:0
            },
            rotate1:0,
            rotate2:180,
            rotate3:0
        }, 
        width  : 0.25*scale,
        height : 3.5*scale,
        depth  :0.25*scale 

    }
} ;

const leftLegsTemp = {
    id : 13,
    width : 0.0,
    height : 0.0,
    depth : 0.0,
    gap1:0,
    gap2:0,
    gap3:0,
};

const neck = {
    id : 14,
    width : 0.3 * scale,
    height : 0.4 * scale,
    depth : scale,
    gap1 : 0.4 * torso.width,
    gap2 : 0.4 * torso.height,
    gap3 : torso.depth,
    
};

const head = {
    id : 15,
    width : 1.5 * scale,
    height : 1.5 * scale,
    depth : 1.5 * scale,
    gap1 : - neck.gap1,
    gap2 : 0.5 * neck.height, 
    gap3 : 0.4 * neck.depth,
};


//torso
    theta1[torso.id]=45;
    theta2[torso.id]=45;
    theta3[torso.id]=0;

    //upper legs->
    //------------------------------------------------------
    //front
    //------------------------------------------------------
    //right
    theta1[legs.upper.right.front.id]=0;
    theta2[legs.upper.right.front.id]=30;
    theta3[legs.upper.right.front.id]=45;

    //left
    theta1[legs.upper.left.front.id]=0;
    theta2[legs.upper.left.front.id]= -30;
    theta3[legs.upper.left.front.id]=45;

    //---------------------------------------------------
    //middle
    //------------------------------------------------------
    //right
    theta1[legs.upper.right.middle.id]=0;
    theta2[legs.upper.right.middle.id]=0;
    theta3[legs.upper.right.middle.id]=45;

    //left
    theta1[legs.upper.left.middle.id]=0;
    theta2[legs.upper.left.middle.id]=0;
    theta3[legs.upper.left.middle.id]=45;

    //---------------------------------------------------
    //back
    //------------------------------------------------------
    //right
    theta1[legs.upper.right.back.id]= 0;
    theta2[legs.upper.right.back.id]= -30;
    theta3[legs.upper.right.back.id]=45;

    //left
    theta1[legs.upper.left.back.id]=0;
    theta2[legs.upper.left.back.id]= 30;
    theta3[legs.upper.left.back.id]=45;


    //lower legs->
    //------------------------------------------------------
    //front
    //------------------------------------------------------
    //right
    theta1[legs.lower.right.front.id]=0;
    theta2[legs.lower.right.front.id]=0;
    theta3[legs.lower.right.front.id]=90;

    //left
    theta1[legs.lower.left.front.id]=0;
    theta2[legs.lower.left.front.id]=0;
    theta3[legs.lower.left.front.id]=90;

    //---------------------------------------------------
    //middle
    //------------------------------------------------------
    //right
    theta1[legs.lower.right.middle.id]=0;
    theta2[legs.lower.right.middle.id]=0;
    theta3[legs.lower.right.middle.id]=90;

    //left
    theta1[legs.lower.left.middle.id]=0;
    theta2[legs.lower.left.middle.id]=0;
    theta3[legs.lower.left.middle.id]=90;

    //---------------------------------------------------
    //back
    //------------------------------------------------------
    //right
    theta1[legs.lower.right.back.id]=0;
    theta2[legs.lower.right.back.id]=0;
    theta3[legs.lower.right.back.id]=90;

    //left
    theta1[legs.lower.left.back.id]=0;
    theta2[legs.lower.left.back.id]=0;
    theta3[legs.lower.left.back.id]=90;

    //-------------------------------------------------
    //temp Left rotate
    //------------------------------------------------
    theta1[leftLegsTemp.id] = 0;
    theta2[leftLegsTemp.id] = 180;
    theta3[leftLegsTemp.id] = 0;

    
    //neck
    theta1[neck.id]= -45;
    theta2[neck.id]=0;
    theta3[neck.id]=0;

    //head 
    theta1[head.id]=45;
    theta2[head.id]=0;
    theta3[head.id]=0;

default_theta.push(theta1);
default_theta.push(theta2);
default_theta.push(theta3);


function initThetas() {
    
    torso.gap1 = default_gaps[0];
    torso.gap2 = default_gaps[1];
    torso.gap3 = default_gaps[2];

    theta1 = default_theta[0];
    theta2 = default_theta[1];
    theta3 = default_theta[2];
    
};