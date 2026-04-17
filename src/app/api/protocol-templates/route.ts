import {getCurrentUser} from '@/lib/auth/getCurrentUser';
import {
    createProtocolTemplate,
    getProtocolTemplates
} from '@/lib/services/protocol/protocol-template.service';

async function getTemplateActor() {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        return {
            success: false,
            status: 401,
            message: 'Unauthorized'
        };
    }

    if (currentUser.role === 'PATIENT') {
        return {
            success: false,
            status: 403,
            message: 'Forbidden'
        };
    }

    return {
        success: true,
        currentUser
    };
}

export async function GET() {
    const actor = await getTemplateActor();

    if (!actor.success) {
        return Response.json(
            {success: false, message: actor.message},
            {status: actor.status}
        );
    }

    if (!actor.currentUser) {
        return Response.json(
            {success: false, message: 'User is required'},
            {status: 400}
        );
    }

    const result = await getProtocolTemplates(actor.currentUser.id);
    return Response.json(result, {status: result.success ? 200 : 400});
}

export async function POST(request: Request) {
    const actor = await getTemplateActor();

    console.log(
        '[protocol-templates.create] actor:',
        JSON.stringify(actor, null, 2)
    );

    if (!actor.success) {
        return Response.json(
            {success: false, message: actor.message},
            {status: actor.status}
        );
    }

    if (!actor.currentUser) {
        return Response.json(
            {success: false, message: 'User is required'},
            {status: 400}
        );
    }

    const body = await request.json();
    const result = await createProtocolTemplate({
        name: body.name,
        description: body.description,
        createdById: actor.currentUser.id,
        weeklyPlan: body.weeklyPlan,
        planCalories: body.planCalories,
        macroPercents: body.macroPercents,
        enabledMeals: body.enabledMeals,
        mealPercentages: body.mealPercentages,
        macroMealPercentages: body.macroMealPercentages
    });

    return Response.json(result, {status: result.success ? 200 : 400});
}
