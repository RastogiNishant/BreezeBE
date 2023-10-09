import { Font, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import MainHeader from './mainHeader';
import PropertyLandlordDetails from './propertyLandlordDetails';
import TenantProfile from './tenantProfile';
import IncomeDetails from './incomeDetails';
import Solvency from './solvency';
import dayjs from 'dayjs';
import { TFunction } from 'i18next';
import { getTranslation } from '../util/translatedKey';
import {
  CREDIT_HISTORY_STATUS,
  INCOME_TYPES_KEYS,
  PUBLIC_CERTIFICATE_KEYS,
  SALUTATION,
} from '../util/constant';

Font.register({
  family: 'Montserrat',
  fonts: [
    { src: '../pdf/fonts/Montserrat-Regular.ttf', fontStyle: 'normal' },
    { src: '../pdf/fonts/Montserrat-Regular.ttf', fontStyle: 'italic' },
    { src: '../pdf/fonts/Montserrat-SemiBold.ttf', fontWeight: 600, fontStyle: 'italic' },
    { src: '../pdf/fonts/Montserrat-SemiBold.ttf', fontWeight: 700, fontStyle: 'normal' },
  ],
});

// Create styles
const styles = StyleSheet.create({
  page: {
    backgroundColor: '#fff',
    fontFamily: 'Montserrat',
    fontSize: 11,
    paddingLeft: 50,
    lineHeight: 1.5,
    flexDirection: 'column',
  },
  headerWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: '30px',
    justifyContent: 'center',
    alignContent: 'center',
  },
  pdfHeader: {
    fontSize: 18,
    fontWeight: 900,
    marginRight: '70px',
    fontFamily: 'Montserrat',
    textTransform: 'uppercase',
  },
  logo: {
    maxWidth: 100,
    marginRight: '50px',
  },
  image: {
    position: 'absolute',
    right: 50,
    padding: 0,
    width: '80px',
    top: 0,
    opacity: 0.8,
  },
  mainSection: {
    position: 'relative',
    paddingTop: 10,
    paddingRight: '50',
    marginTop: 10,
  },
  section: {
    marginTop: '100px',
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  footerSegment: {
    flex: '0 0 33%',
  },
  footerWrapper: {
    backgroundColor: '#F6FCFC',
    fontSize: '7px',
    paddingLeft: '7px',
    borderRadius: '5px',
    marginBottom: '5px',
    alignItems: 'center',
    flexDirection: 'row',
    fontWeight: 700,
    height: 15,
  },
  footerStyles: {
    paddingTop: '3.5px',
    marginLeft: '7px',
    flexDirection: 'row',
    alignItems: 'center',
  },
});

const ifFalsy = (value: any) => (value === null || value === undefined) && '-';

const boolExpressions = (t: TFunction, value: any) =>
  ifFalsy(value) ||
  getTranslation(
    t,
    value
      ? 'landlord.property.tenant_pref.solvency.rent_arrears.yes.message'
      : 'landlord.property.tenant_pref.solvency.rent_arrears.no.message'
  );

const dateOfBirth = (day: any, age: any, place: any) =>
  day || age || place
    ? [dayConverter(day), age && `(${age}),`, place].filter(Boolean).join(' ')
    : '-';

const dayConverter = (day: string) =>
  dayjs(day).isValid() ? dayjs(day).format('DD.MM.YYYY') : day;

const mapDisplayValues = (tenant: any, members: any, t: TFunction) => {
  let startPage = 0;
  let endPage = 0;
  let creditStartPage = 1;
  let creditEndPage = 1;
  let residencyStartPage = 0;

  const getPageCounts = (incomeProofs: any[], nextPagesGap = 0) => {
    endPage = startPage + incomeProofs.length;
    const incomePageNumbers = {
      startPage: ++startPage + 1,
      endPage,
    };
    startPage = endPage + nextPagesGap;
    return incomePageNumbers.endPage > 1 && incomePageNumbers.endPage >= incomePageNumbers.startPage
      ? incomePageNumbers
      : null;
  };

  return {
    tenant: {
      rental_space: `${tenant.space_min || 0}-${tenant.space_max || 1000}` + 'm²',
      household_size: tenant.members_count || '-',
      rooms_min_max: `${tenant.rooms_min || 0}-${tenant.rooms_max || 1000}`,
      rent_budget: `€${tenant.budget_min || 0}-${tenant.budget_max || 10000}`,
      rent_duration: `${tenant.residency_duration_min
        ? tenant.residency_duration_min + '-' + tenant.residency_duration_max
        : getTranslation(t, 'prospect.profile.adult.income.txt_contract_unlimited')
        }`,
      children: tenant.minors_count || '-',
      income_level:
        tenant.wbs_certificate && Array.isArray(tenant.wbs_certificate)
          ? tenant.wbs_certificate
            .reduce((acc: string[], cur: any) => {
              acc.push(getTranslation(t, cur.income_level));
              return acc;
            }, [])
            .join(', ') || '-'
          : '-',
      pets:
        ifFalsy(tenant.pets) || tenant.pets === 2
          ? `${boolExpressions(t, true)}, ${tenant.pets_species}`
          : boolExpressions(t, false),
      rent_start: tenant.rent_start ? dayConverter(tenant.rent_start) : '-',
      parking: tenant.parking_space || '-',
      mixed_use:
        getTranslation(t, 'prospect.profile.general.mixed_use.message') +
        (tenant.mixed_use_type_detail !== null ? `: ${tenant.mixed_use_type_detail}` : ''),
    },

    members: members.map((member: any, index: number) => {
      const incomes = Array.isArray(member.incomes) ? member.incomes : [];
      const totalIncome = incomes.reduce((acc: number, cur: any) => acc + +cur['income'], 0);
      const nextPagesGap =
        (Array.isArray(member['debt_proof']) ? member.debt_proof.length : 0) +
        (member['rent_arrears_doc'] ? 1 : 0);
      const incomeSource = incomes.reduce((acc: string[], cur: any) => {
        if (cur?.income_type) {
          acc.push(
            getTranslation(
              t,
              // @ts-ignore
              INCOME_TYPES_KEYS[cur['income_type']] + '.message'
            )
          );
        }
        return acc;
      }, []);
      const currentJob = incomes.reduce((acc: string[], cur: any) => {
        cur['position'] && acc.push(cur['position']);
        return acc;
      }, []);

      if (member['rent_arrears_doc']) residencyStartPage = creditEndPage + 1;
      return {
        // Personal
        adultNumber: `${getTranslation(
          t,
          'prospect.profile.adult.personal.txt_adult_ph.message'
        )} ${index + 1}`,
        surName:
          member.secondname && member.firstname && member.sex
            ? [
              member.sex &&
              typeof member.sex === 'number' &&
              getTranslation(t, SALUTATION[member.sex - 1]),
              member.firstname,
              member.secondname,
            ]
              .filter(Boolean)
              .join(' ')
            : '-',
        dateOfBirth: dateOfBirth(member.birthday, member.age, member.birth_place),
        citizenship: member.citizen || '-',
        currentAddress: member.last_address || '-',
        email: member.email || '-',
        phone: member.phone || '-',

        // Incomes
        monthlyIncome:
          totalIncome > 0
            ? totalIncome + getTranslation(t, 'prospect.profile.adult.income.txt_currency.message')
            : '-',
        incomeSource: incomeSource.length > 0 ? incomeSource.join(', ') : '-',
        currentJob: currentJob.length > 0 ? currentJob.join(', ') : '-',
        jobDuration: incomes[0]?.employment_type || '-',
        companyDetails: incomes[0]?.company || '-',
        incomePageNumbers: getPageCounts(incomes['proofs'] || [], nextPagesGap),

        // Solvency
        score: (member.credit_score && member.credit_score + ' %') || '-',
        creditHistory:
          member.credit_history_status &&
          getTranslation(t, CREDIT_HISTORY_STATUS[member.credit_history_status]),
        creditScoreIssued: member.credit_score_issued_at
          ? dayConverter(member.credit_score_issued_at)
          : '',
        rentArrears:
          (member.rent_arrears_doc && boolExpressions(t, member.rent_arrears_doc)) ||
          (member.rent_arrears_doc_submit_later &&
            boolExpressions(t, member.rent_arrears_doc_submit_later)) ||
          '-',
        unpaidRental: boolExpressions(t, member.unpaid_rental),
        execution: boolExpressions(t, member.unpaid_rental),
        insolvency: boolExpressions(t, member.insolvency_proceed),
        cleanOut: boolExpressions(t, member.clean_procedure),
        wage: boolExpressions(t, member.income_seizure),
        rentArrearsPageNumber: member['rent_arrears_doc'] && residencyStartPage,

        //document
        proofs: incomes.reduce((acc: any[], cur: any) => {
          acc.push(
            ...cur?.proofs?.map(
              (item: any) => item.file && { file: item.file, name: item.proofFileName }
            )
          );
          return acc;
        }, []),
        debt_proof: member.debt_proof && {
          file: member.debt_proof,
          name: member.debt_proof_file_name,
        },
        rent_arrears_doc: member.rent_arrears_doc && {
          file: member.rent_arrears_doc,
          name: member.rent_arrears_doc_file_name,
        },
      };
    }),
  };
};

export const TenantDocument = (props: { t: TFunction, tenant: any, members?: any[] }) => {
  props?.members?.push({}, {});
  const { tenant, members } = mapDisplayValues(props?.tenant || {}, props?.members || [], props?.t);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View>
          <View style={styles.headerWrapper}>
            <Text style={styles.pdfHeader}>
              {getTranslation(props?.t, 'prospect.profile.pdf.file_name')}
            </Text>
            <Image src={'../pdf/img/BreezeLogo.png'} style={styles.image} />
          </View>
        </View>
        <View style={styles.mainSection} wrap={false}>
          <MainHeader
            leftText={getTranslation(props?.t, 'prospect.rental_application.PROPERTYPREFERENCES')}
            rightText={getTranslation(props?.t, 'prospect.rental_application.HOUSEHOLD')}
          // rightIcon={'../pdf/img/qrCode.png'}
          />
          <PropertyLandlordDetails
            leftLabel={getTranslation(props?.t, 'prospect.rental_application.Rentalspace')}
            leftValue={tenant.rental_space}
            rightIcon
            rightLabel={getTranslation(props?.t, 'prospect.rental_application.HouseholdSize')}
            rightValue={tenant.household_size}
          />
          <PropertyLandlordDetails
            leftLabel={getTranslation(props?.t, 'prospect.rental_application.Rooms')}
            leftValue={tenant.rooms_min_max}
            rightLabel={getTranslation(props?.t, 'prospect.rental_application.Children')}
            rightValue={tenant.children}
          />
          <PropertyLandlordDetails
            leftLabel={getTranslation(props?.t, 'prospect.rental_application.Rent_duration')}
            leftValue={
              <>
                <Text style={{ fontWeight: 'bold' }}>{tenant.rent_budget}, </Text>
                <Text>{tenant.rent_duration}</Text>
              </>
            }
            rightLabel={getTranslation(props?.t, 'prospect.rental_application.UseType')}
            rightValue={tenant.mixed_use}
          />

          <PropertyLandlordDetails
            leftLabel={getTranslation(props?.t, 'prospect.rental_application.PublicCertificate')}
            leftValue={tenant.income_level}
            rightLabel={getTranslation(props?.t, 'prospect.rental_application.Petsintended')}
            rightValue={tenant.pets}
          />
          <PropertyLandlordDetails
            leftLabel={getTranslation(
              props?.t,
              'web.letting.tenant_profile.export.Rent_start.message'
            )}
            leftValue={tenant.rent_start.padStart(10, '0')}
            rightLabel={getTranslation(
              props?.t,
              'prospect.rental_application.InterestatParking_Garage'
            )}
            rightValue={tenant.parking}
          />
          <TenantProfile
            tenantHeader={getTranslation(props?.t, 'prospect.rental_application.PERSONAL')}
            firstLabel={getTranslation(props?.t, 'prospect.rental_application.NameandSurname')}
            secondLabel={getTranslation(
              props?.t,
              'prospect.rental_application.Date_Age_andplaceofbirth'
            )}
            thirdLabel={getTranslation(props?.t, 'prospect.rental_application.Citizenship')}
            fourthLabel={getTranslation(props?.t, 'prospect.rental_application.CurrentAddress')}
            fifthLabel={getTranslation(props?.t, 'prospect.rental_application.Email')}
            sixthLabel={getTranslation(props?.t, 'prospect.rental_application.Tel')}
            tenantDetails={Array.isArray(members) && members.length >= 1 && members.slice(0, 2)}
          />
          <IncomeDetails
            incomeHeader={getTranslation(
              props?.t,
              'web.letting.tenant_profile.export.Income.message'
            )}
            monthlyIncome={getTranslation(
              props?.t,
              'prospect.rental_application.TotalNetMonthlyIncome'
            )}
            incomeSource={getTranslation(
              props?.t,
              'web.letting.tenant_profile.export.Income_Source.message'
            )}
            currentJob={getTranslation(
              props?.t,
              'prospect.rental_application.CurrentJobwithStartDate'
            )}
            jobDuration={getTranslation(props?.t, 'prospect.rental_application.JobTypeandDuration')}
            companyDetails={getTranslation(
              props?.t,
              'prospect.rental_application.Companyname_address'
            )}
            //page={getTranslation(props?.t, 'web.letting.tenant_profile.export.page.message')}
            incomeDetails={Array.isArray(members) && members.length >= 1 && members.slice(0, 2)}
          />
          <Solvency
            isCreditHistoryShown
            solvencyHeader={getTranslation(
              props?.t,
              'web.letting.tenant_profile.export.Solvency.message'
            )}
            score={getTranslation(props?.t, 'prospect.rental_application.CreditHistory')}
            rentArrears={getTranslation(props?.t, 'prospect.rental_application.RentArrears')}
            unpaidRental={getTranslation(
              props?.t,
              'prospect.rental_application.UnpaidRentalObligations'
            )}
            execution={getTranslation(
              props?.t,
              'prospect.profile.adult.creditworthiness.question2'
            )}
            insolvency={getTranslation(
              props?.t,
              'web.letting.tenant_profile.export.Insolvency_procedings.message'
            )}
            cleanOut={getTranslation(props?.t, 'prospect.profile.adult.creditworthiness.question5')}
            wage={getTranslation(props?.t, 'prospect.profile.adult.creditworthiness.question6')}
            // page={getTranslation(props?.t, 'web.letting.tenant_profile.export.page.message')}
            solvencyDetails={Array.isArray(members) && members.length >= 1 && members.slice(0, 2)}
          />
          <View style={styles.section}>
            <View style={styles.footerSegment}>
              <View style={styles.footerWrapper}>
                <Text style={styles.footerStyles}>
                  {getTranslation(props?.t, 'prospect.rental_application.Thisprofileactivatedby')}
                </Text>
              </View>
            </View>
            <View style={[styles.footerSegment, { marginLeft: '7.5px' }]}>
              <View style={styles.footerWrapper}>
                <Text style={styles.footerStyles}>
                  {members[0]?.surName}, {dayjs().format('HH:mm DD.MM.YYYY')}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Page>

      {members
        .reduce((acc: any[], cur: any) => {
          if (cur.proofs?.length > 0) acc.push(...cur.proofs);
          if (Array.isArray(cur.debt_proof)) acc.push(...cur.debt_proof);
          else if (cur.debt_proof?.length > 0) acc.push(cur.debt_proof);
          if (cur.rent_arrears_doc) acc.push(cur.rent_arrears_doc);
          return acc;
        }, [])
        .map((item: any, ind: number) => {
          console.log('file Name: ', item.name);
          console.log('url: ', item.file);

          return (
            <Page size="A4" style={styles.page} key={ind} wrap={true}>
              <View>
                <View style={styles.headerWrapper}>
                  <Text style={styles.pdfHeader}>
                    {getTranslation(props?.t, 'prospect.profile.pdf.file_name')}
                  </Text>
                  <Image src={'../pdf/img/BreezeLogo.png'} style={styles.image} />
                </View>
              </View>
              <View style={styles.mainSection} fixed>
                <Image
                  src={{
                    uri: item.file,
                    method: 'GET',
                    headers: { 'Cache-Control': 'no-cache' },
                    body: null,
                  }}
                  style={{
                    objectFit: 'cover',
                    height: '100%',
                    marginBottom: '20px',
                  }}
                />
              </View>
            </Page>
          );
        })}
    </Document>
  );
};
